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

    logger.info(`HTTPS request to ${url.hostname} also blocked, falling back to Cloudflare + CT logs`);

    // 3) Last resort: Cloudflare proxy first (it does the live HEAD from inside
    // CF's edge AND returns cert details from certspotter when available, in a
    // single round-trip). Only fall back to local CT log queries when the worker
    // didn't recover cert details — this keeps the fast path fast and avoids
    // unnecessary certspotter rate-limit pressure on our prod IP.
    const proxyResult = await proxySSLCheck(siteUrl);
    let cert = proxyResult && proxyResult.cert && proxyResult.cert.validTo ? proxyResult.cert : null;

    if (!cert) {
      const ctResult = await this._fetchCertFromCTLog(url.hostname);
      if (ctResult && ctResult.validTo) cert = ctResult;
    }

    if (cert) {
      const validTo = cert.validTo instanceof Date ? cert.validTo : new Date(cert.validTo);
      const validFrom = cert.validFrom instanceof Date ? cert.validFrom : new Date(cert.validFrom);
      const now = new Date();
      const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

      return {
        issuer: cert.issuer,
        subject: cert.subject || url.hostname,
        validFrom,
        validTo,
        daysRemaining,
        serialNumber: cert.serialNumber || null,
        fingerprint: cert.fingerprint || null,
        protocol: null,
        cipher: null,
        isValid: daysRemaining > 0,
        error: daysRemaining > 0 ? null : `Certificate expired ${Math.abs(daysRemaining)} days ago`,
        checkedAt: new Date(),
      };
    }

    // No cert details recovered from any source. Surface a descriptive error
    // instead of the previous misleading "Verified via Cloudflare proxy" stub —
    // SSLCert.error is what the dashboard exposes, so make it actionable.
    const reason = proxyResult.isValid
      ? 'Cert details unavailable: direct TLS blocked, CT logs returned no covering certificate'
      : `Cert details unavailable: ${proxyResult.error || 'all fallback sources failed'}`;

    return {
      issuer: null,
      subject: url.hostname,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      serialNumber: null,
      fingerprint: null,
      protocol: null,
      cipher: null,
      isValid: false,
      error: reason,
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

  // Query Certificate Transparency logs for cert details. Tries certspotter
  // first (more reliable), then crt.sh as secondary (famously flaky with
  // frequent 502s, so avoid it on the hot path).
  async _fetchCertFromCTLog(hostname) {
    const apex = hostname.replace(/^www\./i, '');
    const variants = [hostname, apex].filter((v, i, a) => a.indexOf(v) === i);

    // Try certspotter per variant first
    for (const host of variants) {
      const cert = await this._queryCertspotter(host);
      if (cert) return cert;
    }

    // Fallback: crt.sh (flaky, last resort)
    for (const host of variants) {
      const cert = await this._queryCrtSh(host);
      if (cert) return cert;
    }

    return null;
  }

  _queryCrtSh(hostname, attempt = 0) {
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'crt.sh',
          path: `/?q=${encodeURIComponent(hostname)}&output=json`,
          method: 'GET',
          timeout: 10000,
          headers: { 'User-Agent': 'Sitelyze/2.0', 'Accept': 'application/json' },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', async () => {
            // Retry once on transient 5xx (crt.sh frequently returns 502)
            if (res.statusCode >= 500 && attempt === 0) {
              logger.debug(`crt.sh ${res.statusCode} for ${hostname}, retrying`);
              await new Promise((r) => setTimeout(r, 800));
              return resolve(await this._queryCrtSh(hostname, 1));
            }
            try {
              const certs = JSON.parse(body);
              if (!Array.isArray(certs) || certs.length === 0) return resolve(null);

              const now = new Date();
              const matching = certs
                .filter((c) => new Date(c.not_after) > now)
                .filter((c) => this._certCoversHost(c.name_value || c.common_name, hostname))
                .sort((a, b) => new Date(b.not_before) - new Date(a.not_before));

              const cert = matching[0] || certs.find((c) => new Date(c.not_after) > now) || certs[0];
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

  _queryCertspotter(hostname) {
    return new Promise((resolve) => {
      const path =
        `/v1/issuances?domain=${encodeURIComponent(hostname)}` +
        `&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert`;
      const req = https.request(
        {
          hostname: 'api.certspotter.com',
          path,
          method: 'GET',
          timeout: 15000,
          headers: { 'User-Agent': 'Sitelyze/2.0', 'Accept': 'application/json' },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode !== 200) {
              logger.debug(`certspotter ${res.statusCode} for ${hostname}`);
              return resolve(null);
            }
            try {
              const certs = JSON.parse(body);
              if (!Array.isArray(certs) || certs.length === 0) return resolve(null);

              const now = new Date();
              const candidates = certs
                .filter((c) => c && !c.revoked && c.not_after && new Date(c.not_after) > now)
                .filter((c) => Array.isArray(c.dns_names) && c.dns_names.some((n) => this._sanCovers(n, hostname)))
                .sort((a, b) => new Date(b.not_before) - new Date(a.not_before));

              const cert = candidates[0];
              if (!cert) return resolve(null);

              const issuerParts = (cert.issuer && cert.issuer.name ? cert.issuer.name : '')
                .split(',')
                .reduce((acc, part) => {
                  const [k, ...v] = part.trim().split('=');
                  if (k && v.length) acc[k.trim()] = v.join('=').trim();
                  return acc;
                }, {});

              resolve({
                issuer:
                  issuerParts.O ||
                  (cert.issuer && cert.issuer.friendly_name) ||
                  issuerParts.CN ||
                  'Unknown',
                subject: (cert.dns_names && cert.dns_names[0]) || hostname,
                validFrom: new Date(cert.not_before),
                validTo: new Date(cert.not_after),
                serialNumber: null,
                fingerprint: cert.cert_sha256 || null,
              });
            } catch (err) {
              logger.debug(`certspotter parse error for ${hostname}: ${err.message}`);
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

  // crt.sh's name_value is newline-separated SAN list. Check any line covers host.
  _certCoversHost(nameValue, hostname) {
    if (!nameValue) return false;
    return String(nameValue)
      .split(/[\n,]/)
      .map((s) => s.trim())
      .some((n) => this._sanCovers(n, hostname));
  }

  _sanCovers(sanEntry, hostname) {
    if (!sanEntry) return false;
    const n = String(sanEntry).toLowerCase();
    const host = hostname.toLowerCase();
    if (n === host) return true;
    if (n.startsWith('*.')) {
      const base = n.slice(2);
      return host.endsWith('.' + base) && host.split('.').length === base.split('.').length + 1;
    }
    return false;
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
