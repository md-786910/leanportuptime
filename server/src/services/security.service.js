const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('../utils/logger');

class SecurityService {
  async runAudit(siteUrl) {
    const checks = [];

    const results = await Promise.allSettled([
      this._checkHttpsEnforced(siteUrl),
      this._checkSecurityHeaders(siteUrl),
      this._checkXmlRpc(siteUrl),
      this._checkDirectoryListing(siteUrl),
      this._checkWpVersionHidden(siteUrl),
      this._checkDebugMode(siteUrl),
      this._checkWpLoginExposed(siteUrl),
      this._checkWpCoreUpdate(siteUrl),
      this._checkPhpErrors(siteUrl),
      this._checkBlacklist(siteUrl),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) checks.push(...result.value);
        else checks.push(result.value);
      }
    }

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === 'pass').length;
    const failedChecks = checks.filter((c) => c.status === 'fail').length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    return { checks, score, totalChecks, passedChecks, failedChecks };
  }

  // ========== EXISTING CHECKS ==========

  async _checkHttpsEnforced(siteUrl) {
    const url = new URL(siteUrl);
    const httpUrl = `http://${url.hostname}${url.pathname}`;

    try {
      const response = await this._httpHead(httpUrl);
      const location = response.headers?.location || '';
      const pass = location.startsWith('https://');
      return {
        check: 'HTTPS Enforced',
        status: pass ? 'pass' : 'fail',
        message: pass ? 'HTTP redirects to HTTPS' : 'HTTP does not redirect to HTTPS',
        severity: 'high',
      };
    } catch {
      return { check: 'HTTPS Enforced', status: 'warn', message: 'Could not verify HTTPS redirect', severity: 'high' };
    }
  }

  async _checkSecurityHeaders(siteUrl) {
    const results = [];
    try {
      const response = await this._httpHead(siteUrl);
      const headers = response.headers || {};

      const hsts = headers['strict-transport-security'];
      results.push({ check: 'HSTS Header', status: hsts ? 'pass' : 'fail', message: hsts ? `HSTS present: ${hsts}` : 'HSTS header missing', severity: 'high' });

      const xfo = headers['x-frame-options'];
      results.push({ check: 'X-Frame-Options', status: xfo ? 'pass' : 'fail', message: xfo ? `X-Frame-Options: ${xfo}` : 'X-Frame-Options header missing', severity: 'medium' });

      const xcto = headers['x-content-type-options'];
      results.push({ check: 'X-Content-Type-Options', status: xcto === 'nosniff' ? 'pass' : 'fail', message: xcto ? `X-Content-Type-Options: ${xcto}` : 'X-Content-Type-Options header missing', severity: 'medium' });

      const csp = headers['content-security-policy'];
      results.push({ check: 'Content-Security-Policy', status: csp ? 'pass' : 'fail', message: csp ? 'CSP header present' : 'CSP header missing', severity: 'medium' });
    } catch {
      results.push({ check: 'Security Headers', status: 'warn', message: 'Could not retrieve headers', severity: 'medium' });
    }
    return results;
  }

  async _checkXmlRpc(siteUrl) {
    const url = new URL(siteUrl);
    const xmlrpcUrl = `${url.origin}/xmlrpc.php`;
    try {
      const response = await this._httpRequest(xmlrpcUrl, 'POST');
      const blocked = [403, 404, 405].includes(response.statusCode);
      return { check: 'XML-RPC Disabled', status: blocked ? 'pass' : 'fail', message: blocked ? `XML-RPC blocked (${response.statusCode})` : `XML-RPC accessible (${response.statusCode})`, severity: 'high' };
    } catch {
      return { check: 'XML-RPC Disabled', status: 'pass', message: 'XML-RPC endpoint not reachable', severity: 'high' };
    }
  }

  async _checkDirectoryListing(siteUrl) {
    const url = new URL(siteUrl);
    const wpContentUrl = `${url.origin}/wp-content/`;
    try {
      const response = await this._httpGet(wpContentUrl);
      const hasListing = response.body.includes('Index of') || response.body.includes('<title>Index');
      return { check: 'Directory Listing', status: hasListing ? 'fail' : 'pass', message: hasListing ? 'Directory listing is enabled' : 'Directory listing is disabled', severity: 'medium' };
    } catch {
      return { check: 'Directory Listing', status: 'pass', message: 'wp-content directory not accessible', severity: 'medium' };
    }
  }

  async _checkWpVersionHidden(siteUrl) {
    try {
      const response = await this._httpGet(siteUrl);
      const hasVersion = /<meta\s+name=["']generator["']\s+content=["']WordPress/i.test(response.body);
      return { check: 'WP Version Hidden', status: hasVersion ? 'fail' : 'pass', message: hasVersion ? 'WordPress version is exposed in HTML' : 'WordPress version is hidden', severity: 'low' };
    } catch {
      return { check: 'WP Version Hidden', status: 'warn', message: 'Could not check WordPress version exposure', severity: 'low' };
    }
  }

  async _checkDebugMode(siteUrl) {
    try {
      const response = await this._httpGet(siteUrl);
      const hasDebug = response.body.includes('WP_DEBUG') || response.body.includes('Fatal error') || response.body.includes('Notice:') || response.body.includes('Warning:');
      return { check: 'Debug Mode Off', status: hasDebug ? 'fail' : 'pass', message: hasDebug ? 'Debug information detected in output' : 'No debug information found', severity: 'high' };
    } catch {
      return { check: 'Debug Mode Off', status: 'warn', message: 'Could not check debug mode', severity: 'high' };
    }
  }

  // ========== NEW WORDPRESS-SPECIFIC CHECKS ==========

  async _checkWpLoginExposed(siteUrl) {
    const url = new URL(siteUrl);
    const loginUrl = `${url.origin}/wp-login.php`;

    try {
      const response = await this._httpGet(loginUrl);
      const isLoginPage = response.body.includes('user_login') || response.body.includes('wp-login');

      if (response.statusCode === 200 && isLoginPage) {
        return {
          check: 'WP-Login Protected',
          status: 'fail',
          message: 'wp-login.php is publicly accessible — add captcha, 2FA, or IP restriction',
          severity: 'high',
        };
      }

      return {
        check: 'WP-Login Protected',
        status: 'pass',
        message: `wp-login.php is protected (HTTP ${response.statusCode})`,
        severity: 'high',
      };
    } catch {
      return { check: 'WP-Login Protected', status: 'pass', message: 'wp-login.php is not accessible', severity: 'high' };
    }
  }

  async _checkWpCoreUpdate(siteUrl) {
    try {
      const siteResponse = await this._httpGet(siteUrl);
      const versionMatch = siteResponse.body.match(
        /<meta\s+name=["']generator["']\s+content=["']WordPress\s+([\d.]+)["']/i
      );

      if (!versionMatch) {
        return {
          check: 'WP Core Updated',
          status: 'warn',
          message: 'Could not detect WordPress version (may be hidden)',
          severity: 'high',
        };
      }

      const currentVersion = versionMatch[1];
      const latestVersion = await this._fetchLatestWpVersion();

      if (!latestVersion) {
        return {
          check: 'WP Core Updated',
          status: 'warn',
          message: `Running WordPress ${currentVersion} — could not verify latest version`,
          severity: 'high',
        };
      }

      const isOutdated = this._compareVersions(currentVersion, latestVersion) < 0;

      return {
        check: 'WP Core Updated',
        status: isOutdated ? 'fail' : 'pass',
        message: isOutdated
          ? `WordPress ${currentVersion} is outdated — latest is ${latestVersion}`
          : `WordPress ${currentVersion} is up to date`,
        severity: 'high',
      };
    } catch {
      return { check: 'WP Core Updated', status: 'warn', message: 'Could not check WordPress version', severity: 'high' };
    }
  }

  async _checkPhpErrors(siteUrl) {
    try {
      const response = await this._httpGet(siteUrl);
      const body = response.body;

      const errors = [];
      if (/Fatal\s+error/i.test(body)) errors.push('Fatal error');
      if (/Parse\s+error/i.test(body)) errors.push('Parse error');
      if (/Warning:\s+/.test(body) && body.includes('.php on line')) errors.push('PHP Warning');
      if (/Notice:\s+/.test(body) && body.includes('.php on line')) errors.push('PHP Notice');
      if (body.includes('wp_die(')) errors.push('wp_die() call');

      // White Screen of Death detection
      const stripped = body.replace(/<\s*\/?\s*\w[^>]*>/g, '').trim();
      if (response.statusCode === 200 && stripped.length < 50 && body.length < 500) {
        errors.push('Blank page (possible WSOD)');
      }

      if (errors.length > 0) {
        return {
          check: 'PHP Error Free',
          status: 'fail',
          message: `PHP errors detected: ${errors.join(', ')}`,
          severity: 'high',
        };
      }

      return { check: 'PHP Error Free', status: 'pass', message: 'No PHP errors detected', severity: 'high' };
    } catch {
      return { check: 'PHP Error Free', status: 'warn', message: 'Could not check for PHP errors', severity: 'high' };
    }
  }

  async _checkBlacklist(siteUrl) {
    try {
      const response = await this._httpGet(siteUrl);
      const body = response.body.toLowerCase();

      const indicators = [
        'this site may be hacked',
        'this site has been reported as unsafe',
        'deceptive site ahead',
        'the site ahead contains malware',
        'suspected phishing site',
        'this account has been suspended',
        'site has been disabled',
        'reported attack page',
      ];

      const found = indicators.find((i) => body.includes(i));

      if (found) {
        return {
          check: 'Blacklist Clean',
          status: 'fail',
          message: `Site may be compromised — detected: "${found}"`,
          severity: 'critical',
        };
      }

      // Check for suspicious redirects to external domains
      if (response.statusCode >= 301 && response.statusCode <= 303) {
        const location = response.headers?.location || '';
        const siteHost = new URL(siteUrl).hostname;
        if (location && !location.includes(siteHost)) {
          return {
            check: 'Blacklist Clean',
            status: 'warn',
            message: `Site redirects to external domain: ${location}`,
            severity: 'critical',
          };
        }
      }

      return { check: 'Blacklist Clean', status: 'pass', message: 'No blacklist or compromise indicators found', severity: 'critical' };
    } catch {
      return { check: 'Blacklist Clean', status: 'warn', message: 'Could not check blacklist status', severity: 'critical' };
    }
  }

  // ========== HELPERS ==========

  async _fetchLatestWpVersion() {
    return new Promise((resolve) => {
      const req = https.request(
        { hostname: 'api.wordpress.org', path: '/core/version-check/1.7/', method: 'GET', timeout: 10000, headers: { 'User-Agent': 'WP-Sentinel/1.0' } },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data.offers?.[0]?.current || data.offers?.[0]?.version || null);
            } catch { resolve(null); }
          });
        }
      );
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  _compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  _httpHead(url) {
    return this._httpRequest(url, 'HEAD');
  }

  _httpGet(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(
        { hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname + parsedUrl.search, method: 'GET', timeout: 10000, headers: { 'User-Agent': 'WP-Sentinel/1.0' } },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
        }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.end();
    });
  }

  _httpRequest(url, method) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(
        { hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname, method, timeout: 10000, headers: { 'User-Agent': 'WP-Sentinel/1.0' } },
        (res) => { res.resume(); resolve({ statusCode: res.statusCode, headers: res.headers }); }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = new SecurityService();
