const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('../utils/logger');
const proxy = require('../utils/proxyFetch');

const vulnDb = require('../data/vuln-db.json');

const COMMON_PLUGINS = [
  'akismet', 'contact-form-7', 'woocommerce', 'wordpress-seo', 'elementor',
  'classic-editor', 'jetpack', 'wordfence', 'wpforms-lite', 'all-in-one-seo-pack',
  'really-simple-ssl', 'updraftplus', 'litespeed-cache', 'wp-super-cache',
  'w3-total-cache', 'redirection', 'duplicate-post', 'google-site-kit',
  'wp-mail-smtp', 'regenerate-thumbnails', 'advanced-custom-fields',
  'wp-fastest-cache', 'tablepress', 'sucuri-scanner', 'better-wp-security',
  'limit-login-attempts-reloaded', 'mailchimp-for-wp', 'cookie-notice',
  'google-analytics-for-wordpress', 'wordpress-importer', 'wp-smushit',
  'shortpixel-image-optimiser', 'autoptimize', 'amp', 'buddypress',
  'bbpress', 'woocommerce-payments', 'wp-rocket', 'yoast-seo-premium',
  'gravityforms', 'ninja-forms', 'formidable', 'wp-migrate-db',
  'query-monitor', 'disable-comments', 'health-check', 'user-role-editor',
  'members', 'wp-crontrol', 'custom-post-type-ui', 'meta-box',
  'svg-support', 'safe-svg', 'imagify', 'ewww-image-optimizer',
];

// Suspicious code patterns for malware detection
const MALWARE_PATTERNS = [
  { regex: /eval\s*\(\s*base64_decode\s*\(/i, label: 'eval(base64_decode()) — obfuscated code execution' },
  { regex: /eval\s*\(\s*gzinflate\s*\(/i, label: 'eval(gzinflate()) — compressed code execution' },
  { regex: /eval\s*\(\s*str_rot13\s*\(/i, label: 'eval(str_rot13()) — obfuscated code execution' },
  { regex: /\bshell_exec\s*\(/i, label: 'shell_exec() — system command execution' },
  { regex: /\bpassthru\s*\(/i, label: 'passthru() — system command execution' },
  { regex: /\bproc_open\s*\(/i, label: 'proc_open() — process execution' },
  { regex: /\bpopen\s*\(/i, label: 'popen() — process execution' },
  { regex: /\bassert\s*\(\s*\$_(GET|POST|REQUEST)/i, label: 'assert() with user input — code injection' },
  { regex: /eval\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/i, label: 'eval() with user input — remote code execution' },
  { regex: /file_put_contents\s*\(.*\$_(FILES|GET|POST|REQUEST)/i, label: 'file_put_contents() with user input — arbitrary file write' },
  { regex: /\bcurl_exec\s*\(.*\$_(GET|POST|REQUEST)/i, label: 'curl_exec() with user input — SSRF risk' },
  { regex: /[A-Za-z0-9+\/=]{200,}/g, label: 'Long base64-encoded string — possible obfuscated payload' },
  { regex: /(\\x[0-9a-fA-F]{2}){10,}/g, label: 'Hex-encoded string — possible obfuscated payload' },
  { regex: /\$GLOBALS\s*\[\s*['"][a-z0-9]{20,}['"]\s*\]/i, label: 'Obfuscated globals variable — malware indicator' },
  { regex: /create_function\s*\(\s*['"].*['"]\s*,\s*\$_(GET|POST|REQUEST)/i, label: 'create_function() with user input — code injection' },
  { regex: /preg_replace\s*\(\s*['"].*\/e['"]/i, label: 'preg_replace with /e modifier — code execution' },
];

class PluginService {
  async scanPlugins(siteUrl) {
    logger.debug(`Plugin scan started: ${siteUrl}`);
    const origin = new URL(siteUrl).origin;

    // Step 1: Detect plugin slugs from HTML source
    const htmlSlugs = await this._detectPluginsFromHtml(siteUrl);
    logger.debug(`Detected ${htmlSlugs.size} plugins from HTML: ${[...htmlSlugs].join(', ')}`);

    // Step 2: Probe common plugins via readme.txt and fetch their info
    const probeResults = await this._probeAndReadPlugins(origin, htmlSlugs);
    logger.debug(`Probed and found ${probeResults.length} additional plugins`);

    // Step 3: Fetch readme.txt for HTML-detected plugins too
    const htmlResults = await this._readPluginReadmes(origin, [...htmlSlugs]);

    // Merge all results, deduplicate by slug
    const pluginMap = new Map();
    for (const p of [...htmlResults, ...probeResults]) {
      if (!pluginMap.has(p.slug)) pluginMap.set(p.slug, p);
    }

    const plugins = [...pluginMap.values()];
    const issueCount = plugins.filter((p) => p.status !== 'ok').length;

    logger.debug(`Plugin scan completed: ${siteUrl} -> ${plugins.length} plugins, ${issueCount} issues`);

    return { plugins, totalPlugins: plugins.length, issueCount };
  }

  async _detectPluginsFromHtml(siteUrl) {
    const slugs = new Set();
    try {
      const response = await this._httpGet(siteUrl);
      const regex = /wp-content\/plugins\/([a-z0-9_-]+)\//gi;
      let match;
      while ((match = regex.exec(response.body)) !== null) {
        slugs.add(match[1].toLowerCase());
      }
    } catch (err) {
      logger.warn(`Plugin HTML detection failed for ${siteUrl}: ${err.message}`);
    }
    return slugs;
  }

  async _probeAndReadPlugins(origin, alreadyFound) {
    const results = [];
    const toProbe = COMMON_PLUGINS.filter((slug) => !alreadyFound.has(slug));

    for (let i = 0; i < toProbe.length; i += 10) {
      const batch = toProbe.slice(i, i + 10);
      const batchResults = await Promise.allSettled(
        batch.map((slug) => this._analyzePlugin(origin, slug))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }

      if (i + 10 < toProbe.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return results;
  }

  async _readPluginReadmes(origin, slugs) {
    const results = [];

    for (let i = 0; i < slugs.length; i += 10) {
      const batch = slugs.slice(i, i + 10);
      const batchResults = await Promise.allSettled(
        batch.map((slug) => this._analyzePlugin(origin, slug))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  /**
   * Full analysis of a single plugin: readme + malware scan + vuln check + solution.
   */
  async _analyzePlugin(origin, slug) {
    const readmeUrl = `${origin}/wp-content/plugins/${slug}/readme.txt`;

    try {
      const response = await this._httpGet(readmeUrl);
      if (response.statusCode !== 200) return null;

      const info = this._parseReadme(response.body);

      // Run malware scan on main plugin PHP file
      const malware = await this._scanForMalware(origin, slug);

      // Check local vulnerability database
      const vulnResult = this._checkVulnerabilities(slug, info.stableTag);

      // Determine status considering all factors
      const status = this._determineStatus({ info, malware, vulnResult });

      // Generate solution
      const solution = this._getSolution({ slug, name: info.name || slug, info, malware, vulnResult, status });

      return {
        slug,
        name: info.name || slug,
        detectedVersion: info.stableTag || null,
        latestVersion: null,
        isOutdated: false,
        isClosed: false,
        isMalicious: malware.isMalicious,
        malwareFindings: malware.findings,
        isVulnerable: vulnResult.isVulnerable,
        vulnerabilities: vulnResult.vulnerabilities,
        solution,
        lastUpdated: null,
        activeInstalls: null,
        wpCompatibility: info.testedUpTo || null,
        status,
      };
    } catch {
      return null;
    }
  }

  // ========== MALWARE SCANNING ==========

  async _scanForMalware(origin, slug) {
    const findings = [];

    try {
      // Fetch the main plugin PHP file
      const phpUrl = `${origin}/wp-content/plugins/${slug}/${slug}.php`;
      const response = await this._httpGet(phpUrl);

      if (response.statusCode !== 200 || !response.body) {
        return { isMalicious: false, findings: [] };
      }

      const body = response.body;

      // Only scan if it looks like PHP (not an HTML error page)
      if (!body.includes('<?php') && !body.includes('<?PHP')) {
        return { isMalicious: false, findings: [] };
      }

      for (const pattern of MALWARE_PATTERNS) {
        if (pattern.regex.test(body)) {
          findings.push(pattern.label);
        }
        // Reset lastIndex for global regexes
        pattern.regex.lastIndex = 0;
      }
    } catch {
      // Can't fetch plugin file — not an error, just skip malware scan
    }

    return {
      isMalicious: findings.length > 0,
      findings,
    };
  }

  // ========== VULNERABILITY CHECK ==========

  _checkVulnerabilities(slug, detectedVersion) {
    const entries = vulnDb[slug];
    if (!entries || !detectedVersion) {
      return { isVulnerable: false, vulnerabilities: [] };
    }

    const vulnerabilities = [];

    for (const entry of entries) {
      if (this._compareVersions(detectedVersion, entry.below) < 0) {
        vulnerabilities.push({
          title: entry.title,
          severity: entry.severity,
          solution: entry.solution,
        });
      }
    }

    return {
      isVulnerable: vulnerabilities.length > 0,
      vulnerabilities,
    };
  }

  _compareVersions(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  // ========== SOLUTION GENERATION ==========

  _getSolution({ name, malware, vulnResult, status }) {
    const parts = [];

    if (malware.isMalicious) {
      parts.push(`URGENT: Suspicious code detected in ${name}. Immediately deactivate and delete this plugin. Scan your entire site for backdoors and compromised files.`);
    }

    if (vulnResult.isVulnerable) {
      for (const v of vulnResult.vulnerabilities) {
        parts.push(`${v.solution} (${v.title})`);
      }
    }

    if (!malware.isMalicious && !vulnResult.isVulnerable && status === 'warn') {
      parts.push(`${name} has not been tested with recent WordPress versions. Consider finding an actively maintained alternative.`);
    }

    if (!malware.isMalicious && !vulnResult.isVulnerable && status === 'critical') {
      parts.push(`${name} is severely outdated (tested for WP < 5.0). Replace with a modern alternative.`);
    }

    if (parts.length === 0) {
      return 'No issues detected.';
    }

    return parts.join(' | ');
  }

  // ========== README PARSING ==========

  _parseReadme(body) {
    const lines = body.split('\n').slice(0, 30);
    const info = {};

    const nameMatch = body.match(/^===\s*(.+?)\s*===/);
    if (nameMatch) info.name = nameMatch[1];

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)/);
      if (!match) continue;

      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();

      switch (key) {
        case 'stable tag':
          info.stableTag = value;
          break;
        case 'tested up to':
          info.testedUpTo = value;
          break;
        case 'requires at least':
          info.requiresWp = value;
          break;
        case 'requires php':
          info.requiresPhp = value;
          break;
      }
    }

    return info;
  }

  // ========== STATUS DETERMINATION ==========

  _determineStatus({ info, malware, vulnResult }) {
    // Malware = always critical
    if (malware.isMalicious) return 'critical';

    // Critical vulnerability
    if (vulnResult.isVulnerable) {
      const hasCritical = vulnResult.vulnerabilities.some((v) => v.severity === 'critical');
      if (hasCritical) return 'critical';
      return 'warn';
    }

    // Old WP compatibility
    if (info.testedUpTo) {
      const tested = parseFloat(info.testedUpTo);
      if (tested && tested < 5.0) return 'critical';
      if (tested && tested < 6.0) return 'warn';
    }

    return 'ok';
  }

  // ========== HTTP HELPERS ==========

  _httpHead(url, opts) {
    return proxy.httpHead(url, opts);
  }

  _httpGet(url, opts) {
    return proxy.httpGet(url, opts);
  }

  _httpRequest(url, method, opts) {
    return proxy.httpRequest(url, method, opts);
  }
}

module.exports = new PluginService();
