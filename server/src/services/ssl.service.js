const tls = require('tls');
const https = require('https');
const { URL } = require('url');
const logger = require('../utils/logger');
const { proxySSLCheck, isBlockedError, UA } = require('../utils/proxyFetch');

class SSLService {
  async checkCertificate(siteUrl) {
    const url = new URL(siteUrl);

    if (url.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Site does not use HTTPS',
      };
    }

    // 1) Try direct TLS connection (raw socket — gives all details)
    const result = await this._directTLSCheck(url);
    if (!result._blocked) return result;

    logger.info(`Direct TLS to ${url.hostname} blocked, trying HTTPS request fallback`);

    // 2) Try HTTPS HEAD request (normal HTTP stack — less likely to be blocked)
    const httpsResult = await this._httpsRequestCheck(url);
    if (!httpsResult._blocked) return httpsResult;

    logger.info(`HTTPS request to ${url.hostname} also blocked, falling back to Cloudflare + crt.sh`);

    // 3) Last resort: Cloudflare proxy + crt.sh for cert details
    const [proxyResult, ctResult] = await Promise.all([
      proxySSLCheck(siteUrl),
      this._fetchCertFromCTLog(url.hostname),
    ]);

    if (ctResult) {
      const now = new Date();
      const daysRemaining = Math.floor((ctResult.validTo - now) / (1000 * 60 * 60 * 24));

      return {
        issuer: ctResult.issuer,
        subject: ctResult.subject,
        validFrom: ctResult.validFrom,
        validTo: ctResult.validTo,
        daysRemaining,
        serialNumber: ctResult.serialNumber,
        fingerprint: null,
        protocol: null,
        cipher: null,
        isValid: proxyResult.isValid && daysRemaining > 0,
        error: proxyResult.isValid ? null : proxyResult.error,
        checkedAt: new Date(),
      };
    }

    return {
      issuer: proxyResult.isValid ? 'Verified via Cloudflare proxy' : 'Unknown',
      subject: url.hostname,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      serialNumber: null,
      fingerprint: null,
      protocol: null,
      cipher: null,
      isValid: proxyResult.isValid,
      error: proxyResult.isValid ? null : proxyResult.error,
      checkedAt: new Date(),
    };
  }

  // Fallback 2: HTTPS HEAD request — extracts cert from the socket
  // Normal HTTP requests are less likely to be blocked by WAFs than raw TLS
  _httpsRequestCheck(url) {
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: url.hostname,
          port: parseInt(url.port, 10) || 443,
          path: '/',
          method: 'HEAD',
          timeout: 15000,
          headers: { 'User-Agent': UA },
        },
        (res) => {
          const socket = res.socket;
          const cert = socket.getPeerCertificate();

          if (!cert || Object.keys(cert).length === 0) {
            res.resume();
            return resolve({ isValid: false, error: 'No certificate found' });
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

          const result = {
            issuer: cert.issuer ? cert.issuer.O || cert.issuer.CN : 'Unknown',
            subject: cert.subject ? cert.subject.CN : 'Unknown',
            validFrom,
            validTo,
            daysRemaining,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint256 || cert.fingerprint,
            protocol: socket.getProtocol ? socket.getProtocol() : null,
            cipher: socket.getCipher ? socket.getCipher().name : null,
            isValid: socket.authorized && daysRemaining > 0,
            error: socket.authorized ? null : socket.authorizationError,
            checkedAt: new Date(),
          };

          res.resume();
          resolve(result);
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ isValid: false, error: 'HTTPS request timed out', _blocked: true });
      });

      req.on('error', (err) => {
        if (isBlockedError(err)) {
          resolve({ isValid: false, error: err.message, _blocked: true });
        } else {
          resolve({ isValid: false, error: err.message });
        }
      });

      req.end();
    });
  }

  // Query Certificate Transparency logs (crt.sh) for cert details
  _fetchCertFromCTLog(hostname) {
    const baseDomain = hostname.replace(/^www\./i, '');
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'crt.sh',
          path: `/?q=${encodeURIComponent(baseDomain)}&output=json`,
          method: 'GET',
          timeout: 10000,
          headers: { 'User-Agent': 'WP-Sentinel/2.0' },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              const certs = JSON.parse(body);
              if (!Array.isArray(certs) || certs.length === 0) {
                return resolve(null);
              }

              const now = new Date();
              const valid = certs
                .filter((c) => new Date(c.not_after) > now)
                .sort((a, b) => new Date(b.not_before) - new Date(a.not_before));

              const cert = valid[0] || certs[0];
              if (!cert) return resolve(null);

              const issuerParts = (cert.issuer_name || '').split(',').reduce((acc, part) => {
                const [key, ...val] = part.trim().split('=');
                if (key && val.length) acc[key.trim()] = val.join('=').trim();
                return acc;
              }, {});

              resolve({
                issuer: issuerParts.O || issuerParts.CN || cert.issuer_name || 'Unknown',
                subject: cert.common_name || hostname,
                validFrom: new Date(cert.not_before),
                validTo: new Date(cert.not_after),
                serialNumber: cert.serial_number || null,
              });
            } catch (err) {
              logger.debug(`crt.sh parse error for ${hostname}: ${err.message}`);
              resolve(null);
            }
          });
        }
      );
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  // Primary: raw TLS connection (gives all details)
  _directTLSCheck(url) {
    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: url.hostname,
          port: parseInt(url.port, 10) || 443,
          servername: url.hostname,
          timeout: 20000,
          ALPNProtocols: ['h2', 'http/1.1'],
          minVersion: 'TLSv1.2',
        },
        () => {
          const cert = socket.getPeerCertificate();

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return resolve({ isValid: false, error: 'No certificate found' });
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

          const result = {
            issuer: cert.issuer ? cert.issuer.O || cert.issuer.CN : 'Unknown',
            subject: cert.subject ? cert.subject.CN : 'Unknown',
            validFrom,
            validTo,
            daysRemaining,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint256 || cert.fingerprint,
            protocol: socket.getProtocol(),
            cipher: socket.getCipher() ? socket.getCipher().name : null,
            isValid: socket.authorized && daysRemaining > 0,
            error: socket.authorized ? null : socket.authorizationError,
            checkedAt: new Date(),
          };

          socket.destroy();
          resolve(result);
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ isValid: false, error: 'SSL connection timed out', _blocked: true });
      });

      socket.on('error', (err) => {
        if (isBlockedError(err)) {
          resolve({ isValid: false, error: err.message, _blocked: true });
        } else {
          resolve({ isValid: false, error: err.message });
        }
      });
    });
  }
}

module.exports = new SSLService();
