const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('../utils/logger');

// Known malicious script domains
const MALICIOUS_DOMAINS = [
  'coinhive.com', 'coin-hive.com', 'crypto-loot.com', 'jsecoin.com',
  'authedmine.com', 'miner.pr0gramm.com', 'ppoi.org', 'cryptonight.wasm',
  'minero.cc', 'crypto-webminer.com', 'webmine.cz', 'papoto.com',
  'rocks.io', 'greenindex.dynamic.miner', 'ad-miner.com',
];

// SEO spam keywords (pharma/gambling)
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'poker', 'casino', 'payday loan', 'buy cheap',
  'pharmacy', 'pill', 'betting', 'slot machine', 'online gambling',
  'cheap meds', 'weight loss pill', 'enlargement',
];

class SiteScanService {
  async runScan(siteUrl) {
    logger.debug(`Site scan started: ${siteUrl}`);
    const checks = [];

    // Step 1: Fetch homepage once, capturing timing
    let homepage;
    try {
      homepage = await this._httpGetTimed(siteUrl);
    } catch (err) {
      return {
        checks: [{
          check: 'Site Reachable',
          category: 'performance',
          status: 'fail',
          message: `Could not fetch site: ${err.message}`,
          detail: 'Ensure the site is online and the URL is correct.',
          severity: 'critical',
        }],
        score: 0,
        performanceScore: 0,
        bugsScore: 0,
        malwareScore: 0,
        totalChecks: 1,
        passedChecks: 0,
        failedChecks: 1,
        warnChecks: 0,
        responseTime: null,
        pageSize: 0,
        resourceCounts: { scripts: 0, stylesheets: 0, images: 0 },
      };
    }

    // Step 2: Run all checks using the cached homepage
    const results = await Promise.allSettled([
      // Performance (7)
      this._checkResponseTime(homepage),
      this._checkPageSize(homepage),
      this._checkCompression(homepage),
      this._checkCacheHeaders(homepage),
      this._checkRenderBlockingScripts(homepage),
      this._checkResourceCount(homepage),
      this._checkLargePageWarning(homepage),
      // Bugs (11)
      this._checkViewportMeta(homepage),
      this._checkCharset(homepage),
      this._checkTitleTag(homepage),
      this._checkMetaDescription(homepage),
      this._checkFavicon(siteUrl, homepage),
      this._checkMixedContent(siteUrl, homepage),
      this._checkBrokenLinks(siteUrl, homepage),
      this._checkPhpErrors(homepage),
      this._checkWordPressDebug(homepage),
      this._checkImageAltText(homepage),
      this._checkDeprecatedHtml(homepage),
      // Malware (7)
      this._checkSuspiciousIframes(homepage),
      this._checkObfuscatedJs(homepage),
      this._checkMaliciousScripts(homepage),
      this._checkHiddenSeoSpam(homepage),
      this._checkMetaRefresh(siteUrl, homepage),
      this._checkBase64Payloads(homepage),
      this._checkDriveByDownloads(homepage),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) checks.push(...result.value);
        else checks.push(result.value);
      }
    }

    // Step 3: Calculate scores
    const scores = this._calculateScores(checks);

    // Step 4: Extract key metrics
    const pageSize = Buffer.byteLength(homepage.body, 'utf8');
    const scriptCount = (homepage.body.match(/<script\b[^>]*\bsrc=/gi) || []).length;
    const cssCount = (homepage.body.match(/<link\b[^>]*rel=["']stylesheet["']/gi) || []).length;
    const imgCount = (homepage.body.match(/<img\b/gi) || []).length;

    logger.debug(`Site scan completed: ${siteUrl} -> Score: ${scores.score}`);

    return {
      checks,
      ...scores,
      responseTime: homepage.responseTime,
      pageSize,
      resourceCounts: { scripts: scriptCount, stylesheets: cssCount, images: imgCount },
    };
  }

  // ========== PERFORMANCE CHECKS ==========

  _checkResponseTime(homepage) {
    const ms = homepage.responseTime;
    let status = 'pass';
    let message = `Response time: ${ms}ms`;

    if (ms >= 3000) {
      status = 'fail';
      message = `Slow response time: ${ms}ms (>= 3s)`;
    } else if (ms >= 1000) {
      status = 'warn';
      message = `Response time: ${ms}ms (>= 1s)`;
    }

    return {
      check: 'Response Time',
      category: 'performance',
      status,
      message,
      detail: status !== 'pass'
        ? 'Optimize server configuration, enable caching, and consider a CDN to reduce response time.'
        : null,
      severity: 'high',
      value: ms,
    };
  }

  _checkPageSize(homepage) {
    const bytes = Buffer.byteLength(homepage.body, 'utf8');
    const kb = Math.round(bytes / 1024);
    let status = 'pass';
    let message = `Page size: ${kb} KB`;

    if (bytes >= 1024 * 1024) {
      status = 'fail';
      message = `Page size: ${kb} KB (>= 1 MB)`;
    } else if (bytes >= 200 * 1024) {
      status = 'warn';
      message = `Page size: ${kb} KB (>= 200 KB)`;
    }

    return {
      check: 'Page Size',
      category: 'performance',
      status,
      message,
      detail: status !== 'pass'
        ? 'Reduce HTML size by removing unused code, minimizing inline styles/scripts, and using pagination for long pages.'
        : null,
      severity: 'medium',
      value: bytes,
    };
  }

  _checkCompression(homepage) {
    const encoding = homepage.headers['content-encoding'] || '';
    const hasCompression = /gzip|br|deflate/i.test(encoding);

    return {
      check: 'Gzip/Brotli Compression',
      category: 'performance',
      status: hasCompression ? 'pass' : 'fail',
      message: hasCompression
        ? `Compression enabled: ${encoding}`
        : 'No compression detected',
      detail: !hasCompression
        ? 'Enable gzip or Brotli compression in your server configuration (Apache: mod_deflate, Nginx: gzip on). This can reduce page size by 60-80%.'
        : null,
      severity: 'medium',
    };
  }

  _checkCacheHeaders(homepage) {
    const h = homepage.headers;
    const has = h['cache-control'] || h['etag'] || h['expires'] || h['last-modified'];

    return {
      check: 'Cache Headers',
      category: 'performance',
      status: has ? 'pass' : 'fail',
      message: has
        ? 'Cache headers present'
        : 'No cache headers detected',
      detail: !has
        ? 'Add Cache-Control, ETag, or Expires headers to enable browser caching and reduce repeat load times.'
        : null,
      severity: 'low',
    };
  }

  _checkRenderBlockingScripts(homepage) {
    const blocking = homepage.body.match(
      /<script\b(?![^>]*\b(?:async|defer|type=["']module["'])\b)[^>]*\bsrc=/gi
    ) || [];
    const count = blocking.length;

    let status = 'pass';
    if (count > 5) status = 'fail';
    else if (count > 0) status = 'warn';

    return {
      check: 'Render-Blocking Scripts',
      category: 'performance',
      status,
      message: count === 0
        ? 'No render-blocking scripts found'
        : `${count} render-blocking script(s) found`,
      detail: count > 0
        ? 'Add async or defer attributes to external scripts that don\'t need to execute immediately. This allows the page to render faster.'
        : null,
      severity: 'medium',
      value: count,
    };
  }

  _checkResourceCount(homepage) {
    const scripts = (homepage.body.match(/<script\b[^>]*\bsrc=/gi) || []).length;
    const styles = (homepage.body.match(/<link\b[^>]*rel=["']stylesheet["']/gi) || []).length;
    const images = (homepage.body.match(/<img\b/gi) || []).length;
    const total = scripts + styles + images;

    let status = 'pass';
    if (total >= 80) status = 'fail';
    else if (total >= 30) status = 'warn';

    return {
      check: 'Resource Count',
      category: 'performance',
      status,
      message: `${total} resources (${scripts} JS, ${styles} CSS, ${images} images)`,
      detail: status !== 'pass'
        ? 'Reduce the number of external resources by combining files, using sprites, and lazy-loading images.'
        : null,
      severity: 'low',
      value: { total, scripts, styles, images },
    };
  }

  _checkLargePageWarning(homepage) {
    const bytes = Buffer.byteLength(homepage.body, 'utf8');
    const kb = Math.round(bytes / 1024);

    let status = 'pass';
    if (bytes > 2 * 1024 * 1024) status = 'fail';
    else if (bytes > 500 * 1024) status = 'warn';

    return {
      check: 'Large Page Warning',
      category: 'performance',
      status,
      message: status === 'pass'
        ? `Page size (${kb} KB) is within acceptable range`
        : `Page is very large: ${kb} KB`,
      detail: status !== 'pass'
        ? 'Extremely large pages hurt mobile users and SEO. Consider pagination, lazy-loading, or splitting content across multiple pages.'
        : null,
      severity: 'high',
    };
  }

  // ========== BUG / ISSUE CHECKS ==========

  _checkViewportMeta(homepage) {
    const hasViewport = /<meta\s[^>]*name=["']viewport["']/i.test(homepage.body);

    return {
      check: 'Viewport Meta Tag',
      category: 'bugs',
      status: hasViewport ? 'pass' : 'fail',
      message: hasViewport
        ? 'Viewport meta tag present'
        : 'Viewport meta tag missing',
      detail: !hasViewport
        ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ensure proper mobile rendering.'
        : null,
      severity: 'medium',
    };
  }

  _checkCharset(homepage) {
    const inMeta = /<meta\s[^>]*charset=/i.test(homepage.body)
      || /<meta\s[^>]*http-equiv=["']Content-Type["']/i.test(homepage.body);
    const inHeader = (homepage.headers['content-type'] || '').toLowerCase().includes('charset=');
    const has = inMeta || inHeader;

    return {
      check: 'Charset Declaration',
      category: 'bugs',
      status: has ? 'pass' : 'fail',
      message: has
        ? 'Charset declaration found'
        : 'No charset declaration found',
      detail: !has
        ? 'Add <meta charset="UTF-8"> early in your <head> to prevent character encoding issues.'
        : null,
      severity: 'low',
    };
  }

  _checkTitleTag(homepage) {
    const match = homepage.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = match ? match[1].trim() : '';

    return {
      check: 'Title Tag',
      category: 'bugs',
      status: title ? 'pass' : 'fail',
      message: title
        ? `Title tag present: "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"`
        : 'Title tag missing or empty',
      detail: !title
        ? 'Add a descriptive <title> tag. It is critical for SEO and appears in browser tabs and search results.'
        : null,
      severity: 'medium',
    };
  }

  _checkMetaDescription(homepage) {
    const match = homepage.body.match(
      /<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    const desc = match ? match[1].trim() : '';

    return {
      check: 'Meta Description',
      category: 'bugs',
      status: desc ? 'pass' : 'fail',
      message: desc
        ? `Meta description present (${desc.length} chars)`
        : 'Meta description missing or empty',
      detail: !desc
        ? 'Add a <meta name="description" content="..."> tag. Search engines display this in results and it helps click-through rates.'
        : null,
      severity: 'low',
    };
  }

  async _checkFavicon(siteUrl, homepage) {
    const hasLinkTag = /<link\s[^>]*rel=["'](?:icon|shortcut icon)["']/i.test(homepage.body);

    if (hasLinkTag) {
      return {
        check: 'Favicon',
        category: 'bugs',
        status: 'pass',
        message: 'Favicon link tag found in HTML',
        severity: 'low',
      };
    }

    try {
      const origin = new URL(siteUrl).origin;
      const response = await this._httpHead(`${origin}/favicon.ico`);
      if (response.statusCode === 200) {
        return {
          check: 'Favicon',
          category: 'bugs',
          status: 'pass',
          message: 'Favicon found at /favicon.ico',
          severity: 'low',
        };
      }
    } catch {
      // fall through
    }

    return {
      check: 'Favicon',
      category: 'bugs',
      status: 'fail',
      message: 'No favicon detected',
      detail: 'Add a favicon to improve browser tab appearance and bookmarks. Add a <link rel="icon" href="/favicon.ico"> tag.',
      severity: 'low',
    };
  }

  _checkMixedContent(siteUrl, homepage) {
    const isHttps = siteUrl.startsWith('https://');
    if (!isHttps) {
      return {
        check: 'Mixed Content',
        category: 'bugs',
        status: 'warn',
        message: 'Site uses HTTP — mixed content check not applicable',
        severity: 'high',
      };
    }

    const mixed = homepage.body.match(/(?:src|href|action)=["']http:\/\/[^"']+["']/gi) || [];
    const count = mixed.length;

    return {
      check: 'Mixed Content',
      category: 'bugs',
      status: count > 0 ? 'fail' : 'pass',
      message: count > 0
        ? `${count} HTTP resource(s) on HTTPS page`
        : 'No mixed content detected',
      detail: count > 0
        ? 'Update all resource URLs to use HTTPS to prevent browser security warnings and blocked content.'
        : null,
      severity: 'high',
      value: count,
    };
  }

  async _checkBrokenLinks(siteUrl, homepage) {
    const origin = new URL(siteUrl).origin;
    const hostname = new URL(siteUrl).hostname;

    const linkRegex = /<a\s[^>]*href=["']([^"'#]+)["']/gi;
    const links = new Set();
    let match;
    while ((match = linkRegex.exec(homepage.body)) !== null && links.size < 10) {
      try {
        const resolved = new URL(match[1], origin);
        if (resolved.hostname === hostname && resolved.pathname !== '/') {
          links.add(resolved.href);
        }
      } catch {
        // skip invalid URLs
      }
    }

    if (links.size === 0) {
      return {
        check: 'Internal Links',
        category: 'bugs',
        status: 'pass',
        message: 'No internal links to check',
        severity: 'medium',
      };
    }

    const linkArray = [...links].slice(0, 10);
    let broken = 0;
    const brokenPaths = [];

    for (let i = 0; i < linkArray.length; i += 5) {
      const batch = linkArray.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((url) => this._httpHead(url))
      );
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          const code = results[j].value.statusCode;
          if (code === 404 || code >= 500) {
            broken++;
            brokenPaths.push(new URL(batch[j]).pathname);
          }
        } else {
          broken++;
          brokenPaths.push(new URL(batch[j]).pathname);
        }
      }
    }

    const checked = linkArray.length;
    if (broken === 0) {
      return {
        check: 'Internal Links',
        category: 'bugs',
        status: 'pass',
        message: `All ${checked} sampled internal links are accessible`,
        severity: 'medium',
        value: { checked, broken: 0 },
      };
    }

    return {
      check: 'Internal Links',
      category: 'bugs',
      status: 'fail',
      message: `${broken} of ${checked} sampled internal links are broken`,
      detail: `Broken paths: ${brokenPaths.join(', ')}. Fix or remove these links.`,
      severity: 'medium',
      value: { checked, broken, brokenPaths },
    };
  }

  _checkPhpErrors(homepage) {
    const body = homepage.body;
    const errors = [];

    if (/Fatal\s+error/i.test(body)) errors.push('Fatal error');
    if (/Parse\s+error/i.test(body)) errors.push('Parse error');
    if (/Warning:\s+/.test(body) && body.includes('.php on line')) errors.push('PHP Warning');
    if (/Notice:\s+/.test(body) && body.includes('.php on line')) errors.push('PHP Notice');

    return {
      check: 'PHP Errors',
      category: 'bugs',
      status: errors.length > 0 ? 'fail' : 'pass',
      message: errors.length > 0
        ? `PHP errors detected: ${errors.join(', ')}`
        : 'No PHP errors detected',
      detail: errors.length > 0
        ? 'Disable display_errors in production and set WP_DEBUG to false. PHP errors expose internal paths and may indicate code issues.'
        : null,
      severity: 'high',
    };
  }

  _checkWordPressDebug(homepage) {
    const body = homepage.body;
    const hasDebug = body.includes('WP_DEBUG')
      || /xdebug/i.test(body)
      || body.includes('wp-content/debug.log');

    return {
      check: 'WordPress Debug Mode',
      category: 'bugs',
      status: hasDebug ? 'fail' : 'pass',
      message: hasDebug
        ? 'WordPress debug output detected'
        : 'No debug output detected',
      detail: hasDebug
        ? 'Set WP_DEBUG to false in wp-config.php for production. Debug output exposes sensitive information.'
        : null,
      severity: 'high',
    };
  }

  _checkImageAltText(homepage) {
    const images = homepage.body.match(/<img\b[^>]*>/gi) || [];
    if (images.length === 0) {
      return {
        check: 'Image Alt Text',
        category: 'bugs',
        status: 'pass',
        message: 'No images found to check',
        severity: 'low',
      };
    }

    const missingAlt = images.filter(
      (img) => !/\balt=["'][^"']+["']/i.test(img)
    ).length;
    const pct = Math.round(((images.length - missingAlt) / images.length) * 100);

    let status = 'pass';
    if (pct < 50) status = 'fail';
    else if (pct < 90) status = 'warn';

    return {
      check: 'Image Alt Text',
      category: 'bugs',
      status,
      message: `${pct}% of images have alt text (${images.length - missingAlt}/${images.length})`,
      detail: status !== 'pass'
        ? 'Add descriptive alt attributes to images for accessibility and SEO. Screen readers rely on alt text.'
        : null,
      severity: 'low',
      value: { total: images.length, missing: missingAlt, pct },
    };
  }

  _checkDeprecatedHtml(homepage) {
    const deprecated = ['marquee', 'blink', 'font', 'center', 'big', 'strike', 'tt'];
    const found = deprecated.filter(
      (tag) => new RegExp(`<${tag}[\\s>]`, 'i').test(homepage.body)
    );

    return {
      check: 'Deprecated HTML',
      category: 'bugs',
      status: found.length > 0 ? 'fail' : 'pass',
      message: found.length > 0
        ? `Deprecated HTML tags found: <${found.join('>, <')}>`
        : 'No deprecated HTML tags found',
      detail: found.length > 0
        ? 'Replace deprecated HTML tags with modern CSS alternatives for better compatibility and standards compliance.'
        : null,
      severity: 'low',
    };
  }

  // ========== MALWARE / VIRUS CHECKS ==========

  _checkSuspiciousIframes(homepage) {
    const iframes = homepage.body.match(/<iframe\b[^>]*>/gi) || [];
    const suspicious = [];

    for (const iframe of iframes) {
      const lower = iframe.toLowerCase();
      if (
        /display\s*:\s*none/i.test(lower)
        || /visibility\s*:\s*hidden/i.test(lower)
        || /width=["']?[01]["']?/i.test(lower)
        || /height=["']?[01]["']?/i.test(lower)
        || /position\s*:\s*absolute[^"']*(?:left|top)\s*:\s*-\d{3,}/i.test(lower)
      ) {
        suspicious.push(iframe.substring(0, 120));
      }
    }

    return {
      check: 'Hidden Iframes',
      category: 'malware',
      status: suspicious.length > 0 ? 'fail' : 'pass',
      message: suspicious.length > 0
        ? `${suspicious.length} suspicious hidden iframe(s) detected`
        : 'No suspicious iframes detected',
      detail: suspicious.length > 0
        ? 'Hidden iframes may inject malicious content. Review your theme and plugin files for unauthorized code. Check: ' + suspicious[0]
        : null,
      severity: 'critical',
    };
  }

  _checkObfuscatedJs(homepage) {
    const patterns = [
      { regex: /eval\s*\(\s*atob\s*\(/i, label: 'eval(atob())' },
      { regex: /eval\s*\(\s*unescape\s*\(/i, label: 'eval(unescape())' },
      { regex: /eval\s*\(\s*String\.fromCharCode\s*\(/i, label: 'eval(String.fromCharCode())' },
      { regex: /document\.write\s*\(\s*unescape\s*\(/i, label: 'document.write(unescape())' },
      { regex: /document\.write\s*\(\s*atob\s*\(/i, label: 'document.write(atob())' },
      { regex: /Function\s*\(\s*atob\s*\(/i, label: 'Function(atob())' },
    ];

    const found = [];
    for (const p of patterns) {
      if (p.regex.test(homepage.body)) {
        found.push(p.label);
      }
    }

    return {
      check: 'Obfuscated JavaScript',
      category: 'malware',
      status: found.length > 0 ? 'fail' : 'pass',
      message: found.length > 0
        ? `Obfuscated JavaScript detected: ${found.join(', ')}`
        : 'No obfuscated JavaScript detected',
      detail: found.length > 0
        ? 'Obfuscated JavaScript is a common malware indicator. Review and remove any code you did not add. Scan your site with a security plugin.'
        : null,
      severity: 'critical',
    };
  }

  _checkMaliciousScripts(homepage) {
    const scriptSrcs = homepage.body.match(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi) || [];
    const found = [];

    for (const tag of scriptSrcs) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;
      const src = srcMatch[1].toLowerCase();

      for (const domain of MALICIOUS_DOMAINS) {
        if (src.includes(domain)) {
          found.push(domain);
          break;
        }
      }
    }

    return {
      check: 'Malicious External Scripts',
      category: 'malware',
      status: found.length > 0 ? 'fail' : 'pass',
      message: found.length > 0
        ? `Scripts from malicious domains: ${[...new Set(found)].join(', ')}`
        : 'No malicious external scripts detected',
      detail: found.length > 0
        ? 'Remove scripts loading from known malware/mining domains immediately. Check your theme, plugins, and wp-config.php for injected code.'
        : null,
      severity: 'critical',
    };
  }

  _checkHiddenSeoSpam(homepage) {
    // Find hidden elements and check for spam keywords
    const hiddenBlocks = homepage.body.match(
      /<(?:div|span|p)\b[^>]*style=["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|span|p)>/gi
    ) || [];

    const found = [];
    for (const block of hiddenBlocks) {
      const text = block.replace(/<[^>]+>/g, '').toLowerCase();
      for (const keyword of SPAM_KEYWORDS) {
        if (text.includes(keyword)) {
          found.push(keyword);
          break;
        }
      }
    }

    return {
      check: 'Hidden SEO Spam',
      category: 'malware',
      status: found.length > 0 ? 'fail' : 'pass',
      message: found.length > 0
        ? `SEO spam keywords found in hidden content: ${[...new Set(found)].join(', ')}`
        : 'No hidden SEO spam detected',
      detail: found.length > 0
        ? 'Your site has been injected with hidden SEO spam. This harms your search rankings and may get your site blacklisted. Clean the compromised files and change all admin passwords.'
        : null,
      severity: 'high',
    };
  }

  _checkMetaRefresh(siteUrl, homepage) {
    const match = homepage.body.match(
      /<meta\s[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'\s]+)/i
    );

    if (!match) {
      return {
        check: 'Suspicious Redirects',
        category: 'malware',
        status: 'pass',
        message: 'No meta refresh redirects detected',
        severity: 'high',
      };
    }

    const redirectUrl = match[1];
    const siteHost = new URL(siteUrl).hostname;
    let isExternal = false;

    try {
      const targetHost = new URL(redirectUrl, siteUrl).hostname;
      isExternal = targetHost !== siteHost;
    } catch {
      isExternal = true;
    }

    return {
      check: 'Suspicious Redirects',
      category: 'malware',
      status: isExternal ? 'fail' : 'warn',
      message: isExternal
        ? `Meta refresh redirect to external domain: ${redirectUrl}`
        : `Meta refresh redirect found: ${redirectUrl}`,
      detail: isExternal
        ? 'Your site redirects visitors to an external domain via meta refresh. This is a common malware injection technique. Remove the injected meta tag.'
        : 'A same-domain meta refresh was found. Verify this is intentional.',
      severity: 'high',
    };
  }

  _checkBase64Payloads(homepage) {
    // Only look inside <script> tags
    const scripts = homepage.body.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
    let found = false;

    for (const script of scripts) {
      // Remove the script tags themselves
      const inner = script.replace(/<\/?script[^>]*>/gi, '');
      // Look for long base64 strings, excluding data URIs for images
      const base64Matches = inner.match(/[A-Za-z0-9+/=]{200,}/g) || [];
      for (const m of base64Matches) {
        // Skip if it looks like a data URI image (preceded by "data:image")
        const idx = inner.indexOf(m);
        const preceding = inner.substring(Math.max(0, idx - 30), idx).toLowerCase();
        if (preceding.includes('data:image')) continue;
        found = true;
        break;
      }
      if (found) break;
    }

    return {
      check: 'Base64 Encoded Payloads',
      category: 'malware',
      status: found ? 'fail' : 'pass',
      message: found
        ? 'Large Base64-encoded payload found in script tag'
        : 'No suspicious Base64 payloads in scripts',
      detail: found
        ? 'Long Base64-encoded strings in JavaScript are often used to hide malicious code. Decode and inspect the content, then remove if malicious.'
        : null,
      severity: 'critical',
    };
  }

  _checkDriveByDownloads(homepage) {
    const patterns = [
      { regex: /window\.location\s*=\s*["'][^"']*\.(?:exe|msi|dmg|apk|bat|cmd)["']/i, label: 'auto-redirect to executable' },
      { regex: /location\.href\s*=\s*["'][^"']*\.(?:exe|msi|dmg|apk|bat|cmd)["']/i, label: 'auto-redirect to executable' },
      { regex: /document\.createElement\s*\(\s*["']iframe["']\s*\)[\s\S]{0,200}\.(?:exe|msi|dmg|apk)/i, label: 'hidden iframe download' },
      { regex: /<a\b[^>]*download[^>]*href=["'][^"']*\.(?:exe|msi|dmg|apk|bat)["'][^>]*style=["'][^"']*display\s*:\s*none/i, label: 'hidden auto-download link' },
    ];

    const found = [];
    for (const p of patterns) {
      if (p.regex.test(homepage.body)) {
        found.push(p.label);
      }
    }

    return {
      check: 'Drive-By Downloads',
      category: 'malware',
      status: found.length > 0 ? 'fail' : 'pass',
      message: found.length > 0
        ? `Drive-by download patterns detected: ${[...new Set(found)].join(', ')}`
        : 'No drive-by download patterns detected',
      detail: found.length > 0
        ? 'Your site attempts to automatically download executables. This is a serious compromise. Take the site offline, remove the injected code, and investigate.'
        : null,
      severity: 'critical',
    };
  }

  // ========== SCORE CALCULATION ==========

  _calculateScores(checks) {
    const byCategory = { performance: [], bugs: [], malware: [] };

    for (const check of checks) {
      if (byCategory[check.category]) {
        byCategory[check.category].push(check);
      }
    }

    const weights = { critical: 4, high: 3, medium: 2, low: 1 };

    const calcCategoryScore = (categoryChecks) => {
      if (categoryChecks.length === 0) return 100;

      let totalWeight = 0;
      let earnedWeight = 0;

      for (const c of categoryChecks) {
        const w = weights[c.severity] || 1;
        totalWeight += w;
        if (c.status === 'pass') earnedWeight += w;
        else if (c.status === 'warn') earnedWeight += w * 0.5;
      }

      return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
    };

    const performanceScore = calcCategoryScore(byCategory.performance);
    const bugsScore = calcCategoryScore(byCategory.bugs);
    const malwareScore = calcCategoryScore(byCategory.malware);

    // Overall: weighted average (performance 30%, bugs 25%, malware 45%)
    let score = Math.round(
      performanceScore * 0.30 + bugsScore * 0.25 + malwareScore * 0.45
    );

    // Hard cap: if any malware check fails, overall max 40
    const hasMalwareFail = byCategory.malware.some((c) => c.status === 'fail');
    if (hasMalwareFail) score = Math.min(score, 40);

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === 'pass').length;
    const failedChecks = checks.filter((c) => c.status === 'fail').length;
    const warnChecks = checks.filter((c) => c.status === 'warn').length;

    return {
      score,
      performanceScore,
      bugsScore,
      malwareScore,
      totalChecks,
      passedChecks,
      failedChecks,
      warnChecks,
    };
  }

  // ========== HTTP HELPERS ==========

  _httpGetTimed(url) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          timeout: 15000,
          headers: { 'User-Agent': 'WP-Sentinel/1.0' },
        },
        (res) => {
          let body = '';
          let size = 0;
          const maxSize = 5 * 1024 * 1024; // 5MB cap
          res.on('data', (chunk) => {
            size += chunk.length;
            if (size <= maxSize) body += chunk;
          });
          res.on('end', () =>
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body,
              responseTime: Date.now() - start,
            })
          );
        }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.end();
    });
  }

  _httpHead(url) {
    return this._httpRequest(url, 'HEAD');
  }

  _httpGet(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          timeout: 10000,
          headers: { 'User-Agent': 'WP-Sentinel/1.0' },
        },
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
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          timeout: 5000,
          headers: { 'User-Agent': 'WP-Sentinel/1.0' },
        },
        (res) => { res.resume(); resolve({ statusCode: res.statusCode, headers: res.headers }); }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = new SiteScanService();
