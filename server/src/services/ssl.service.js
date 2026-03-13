const tls = require('tls');
const { URL } = require('url');
const logger = require('../utils/logger');

class SSLService {
  async checkCertificate(siteUrl) {
    const url = new URL(siteUrl);

    if (url.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Site does not use HTTPS',
      };
    }

    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: url.hostname,
          port: parseInt(url.port, 10) || 443,
          servername: url.hostname,
          timeout: 10000,
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
        resolve({ isValid: false, error: 'SSL connection timed out' });
      });

      socket.on('error', (err) => {
        resolve({ isValid: false, error: err.message });
      });
    });
  }
}

module.exports = new SSLService();
