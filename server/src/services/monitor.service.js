const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('../utils/logger');

class MonitorService {
  /**
   * Perform a full uptime check with detailed timing metrics
   */
  async performCheck(siteUrl, expectedKeywords = []) {
    const url = new URL(siteUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const timings = {};
    const startTime = process.hrtime.bigint();

    return new Promise((resolve) => {
      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 30000,
          headers: {
            'User-Agent': 'WP-Sentinel/1.0 (WordPress Monitor)',
          },
        },
        (res) => {
          timings.ttfb = this._hrToMs(process.hrtime.bigint() - startTime);

          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });

          res.on('end', () => {
            timings.responseTime = this._hrToMs(process.hrtime.bigint() - startTime);
            timings.pageSize = Buffer.byteLength(body, 'utf8');

            const wpVersion = this._extractWpVersion(body);
            const phpVersion = res.headers['x-powered-by'] || null;

            let status = this._determineStatus(res.statusCode, timings.responseTime);

            // Keyword verification
            let keywordMatch = true;
            let missingKeywords = [];
            if (expectedKeywords.length > 0 && status !== 'down') {
              const bodyLower = body.toLowerCase();
              missingKeywords = expectedKeywords.filter(
                (kw) => !bodyLower.includes(kw.toLowerCase())
              );
              keywordMatch = missingKeywords.length === 0;
              if (!keywordMatch) status = 'degraded';
            }

            resolve({
              status,
              httpStatus: res.statusCode,
              responseTime: Math.round(timings.responseTime),
              ttfb: Math.round(timings.ttfb),
              dnsTime: Math.round(timings.dnsTime || 0),
              tlsTime: Math.round(timings.tlsTime || 0),
              pageSize: timings.pageSize,
              wpVersion,
              phpVersion,
              keywordMatch,
              missingKeywords,
              error: null,
            });
          });
        }
      );

      req.on('socket', (socket) => {
        socket.on('lookup', () => {
          timings.dnsTime = this._hrToMs(process.hrtime.bigint() - startTime);
        });
        socket.on('connect', () => {
          timings.connectTime = this._hrToMs(process.hrtime.bigint() - startTime);
        });
        socket.on('secureConnect', () => {
          timings.tlsTime = this._hrToMs(
            process.hrtime.bigint() - startTime
          ) - (timings.connectTime || 0);
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'down',
          httpStatus: null,
          responseTime: 30000,
          ttfb: null,
          dnsTime: null,
          tlsTime: null,
          pageSize: null,
          wpVersion: null,
          phpVersion: null,
          error: 'Request timed out after 30s',
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 'down',
          httpStatus: null,
          responseTime: Math.round(this._hrToMs(process.hrtime.bigint() - startTime)),
          ttfb: null,
          dnsTime: null,
          tlsTime: null,
          pageSize: null,
          wpVersion: null,
          phpVersion: null,
          error: err.message,
        });
      });

      req.end();
    });
  }

  _hrToMs(hrtime) {
    return Number(hrtime) / 1e6;
  }

  _extractWpVersion(html) {
    const match = html.match(/<meta\s+name=["']generator["']\s+content=["']WordPress\s+([\d.]+)["']/i);
    return match ? match[1] : null;
  }

  _determineStatus(httpStatus, responseTime) {
    if (httpStatus >= 200 && httpStatus < 400) {
      return responseTime > 5000 ? 'degraded' : 'up';
    }
    return 'down';
  }
}

module.exports = new MonitorService();
