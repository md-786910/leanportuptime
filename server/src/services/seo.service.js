const cheerio = require('cheerio');
const { URL } = require('url');
const logger = require('../utils/logger');
const proxy = require('../utils/proxyFetch');
const config = require('../config');

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'are', 'was',
  'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor',
  'so', 'if', 'as', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'she', 'they', 'them', 'their', 'his', 'her', 'who', 'which',
  'what', 'when', 'where', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'just',
  'about', 'above', 'after', 'again', 'also', 'am', 'any', 'because',
  'been', 'before', 'being', 'below', 'between', 'down', 'during', 'get',
  'here', 'into', 'like', 'make', 'many', 'much', 'only', 'out', 'over',
  'own', 'same', 'then', 'there', 'these', 'those', 'through', 'under',
  'until', 'up', 'us', 'well', 'while',
]);

const SOCIAL_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'linkedin.com', 'youtube.com', 'pinterest.com', 'tiktok.com',
];

class SeoService {
  async runAudit(siteUrl, existingPageSpeed = null) {
    logger.debug(`SEO audit started: ${siteUrl}`);
    const checks = [];

    let homepage;
    try {
      homepage = await this._httpGetTimed(siteUrl);
    } catch (err) {
      return {
        checks: [{
          check: 'Site Reachable',
          category: 'meta-tags',
          status: 'fail',
          message: `Could not fetch site: ${err.message}`,
          impact: 'Your site is completely invisible to search engines and users. No SEO analysis is possible.',
          fix: 'Ensure the site is online, the URL is correct, and the server responds to HTTP requests.',
          severity: 'critical',
        }],
        score: 0, metaTagsScore: 0, contentScore: 0, linksScore: 0, performanceScore: 0,
        totalChecks: 1, passedChecks: 0, failedChecks: 1, warnChecks: 0, pageSpeed: null,
      };
    }

    const $ = cheerio.load(homepage.body);

    const selfHostedResults = await Promise.allSettled([
      this._checkTitleTag($),
      this._checkMetaDescription($),
      this._checkMetaKeywords($),
      this._checkCanonicalUrl($, siteUrl),
      this._checkRobotsMeta($),
      this._checkOpenGraphTags($),
      this._checkTwitterCardTags($),
      this._checkViewportMeta($),
      this._checkHreflangTags($),
      this._checkH1Tag($),
      this._checkHeadingHierarchy($),
      this._checkImageAltText($),
      this._checkKeywordDensity($),
      this._checkContentLength($),
      this._checkStructuredData($),
      this._checkInternalLinks($, siteUrl),
      this._checkExternalLinks($, siteUrl),
      this._checkBrokenLinks($, siteUrl),
      this._checkNofollowUsage($),
      this._checkSocialMediaLinks($),
    ]);

    for (const result of selfHostedResults) {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) checks.push(...result.value);
        else checks.push(result.value);
      }
    }

    let pageSpeed = null;
    let pageSpeedError = null;
    try {
      pageSpeed = await this._fetchPageSpeedData(siteUrl, existingPageSpeed?.fetchedAt);
    } catch (err) {
      pageSpeedError = err.message;
      logger.error(`PageSpeed API failed for ${siteUrl}: ${err.message}`, { stack: err.stack });
    }

    // Fall back to previous data on cache hit or API failure
    if (!pageSpeed && existingPageSpeed) {
      pageSpeed = existingPageSpeed;
      pageSpeedError = null; // cleared — using cached data
    }

    if (pageSpeed) {
      checks.push(...this._generatePageSpeedChecks(pageSpeed));
    }

    const scores = this._calculateScores(checks);

    // Use Lighthouse performance score directly when available
    if (pageSpeed) {
      const lhPerf = pageSpeed.mobile?.performance ?? pageSpeed.desktop?.performance;
      if (lhPerf != null) {
        scores.performanceScore = lhPerf;
      }
    }

    logger.debug(`SEO audit completed: ${siteUrl} -> Score: ${scores.score}`);

    return { checks, ...scores, pageSpeed, pageSpeedError };
  }

  async fetchPageSpeed(siteUrl) {
    return this._fetchPageSpeedData(siteUrl, null);
  }

  // ========== META TAG CHECKS ==========

  _checkTitleTag($) {
    const title = $('title').first().text().trim();

    if (!title) {
      return {
        check: 'Title Tag', category: 'meta-tags', status: 'fail', severity: 'high',
        message: 'Title tag missing or empty',
        impact: 'Search engines cannot determine your page topic. Your listing in search results will show a generic or missing title, drastically reducing click-through rates.',
        fix: 'Add a unique <title> tag with your primary keyword, between 30-60 characters (e.g., <title>Best Running Shoes 2024 | MyStore</title>).',
      };
    }

    const len = title.length;
    if (len < 30) {
      return {
        check: 'Title Tag', category: 'meta-tags', status: 'warn', severity: 'high',
        message: `Title tag present: "${title.substring(0, 60)}" (${len} chars)`,
        impact: 'Short titles waste valuable search result real estate and may not convey enough context for users to click.',
        fix: `Expand your title to 30-60 characters by including your primary keyword and a compelling value proposition.`,
        value: { title, length: len },
      };
    }

    if (len > 60) {
      return {
        check: 'Title Tag', category: 'meta-tags', status: 'warn', severity: 'high',
        message: `Title tag present: "${title.substring(0, 60)}..." (${len} chars)`,
        impact: 'Google will truncate your title in search results, potentially cutting off important keywords or your brand name.',
        fix: 'Shorten to 60 characters or less. Put the most important keywords at the beginning.',
        value: { title, length: len },
      };
    }

    return {
      check: 'Title Tag', category: 'meta-tags', status: 'pass', severity: 'high',
      message: `Title tag present: "${title.substring(0, 60)}" (${len} chars)`,
      value: { title, length: len },
    };
  }

  _checkMetaDescription($) {
    const desc = $('meta[name="description"]').attr('content')?.trim() || '';

    if (!desc) {
      return {
        check: 'Meta Description', category: 'meta-tags', status: 'fail', severity: 'high',
        message: 'Meta description missing or empty',
        impact: 'Google will auto-generate a snippet from your page content, which is often irrelevant and unappealing. This significantly lowers click-through rates.',
        fix: 'Add <meta name="description" content="..."> with a compelling 120-160 character summary that includes your target keyword and a call to action.',
      };
    }

    const len = desc.length;
    if (len < 120) {
      return {
        check: 'Meta Description', category: 'meta-tags', status: 'warn', severity: 'high',
        message: `Meta description present (${len} chars)`,
        impact: 'Short descriptions don\'t fully utilize the search result snippet space, missing an opportunity to convince users to click.',
        fix: 'Expand to 120-160 characters. Include your primary keyword naturally and add a compelling reason to visit your page.',
        value: { length: len },
      };
    }

    if (len > 160) {
      return {
        check: 'Meta Description', category: 'meta-tags', status: 'warn', severity: 'high',
        message: `Meta description present (${len} chars)`,
        impact: 'Google will truncate your description, potentially cutting off your call to action or key selling points.',
        fix: 'Trim to 160 characters or less. Front-load the most important information.',
        value: { length: len },
      };
    }

    return {
      check: 'Meta Description', category: 'meta-tags', status: 'pass', severity: 'high',
      message: `Meta description present (${len} chars)`,
      value: { length: len },
    };
  }

  _checkMetaKeywords($) {
    const keywords = $('meta[name="keywords"]').attr('content')?.trim() || '';

    if (!keywords) {
      return {
        check: 'Meta Keywords', category: 'meta-tags', status: 'warn', severity: 'low',
        message: 'Meta keywords tag not found',
        impact: 'While Google ignores meta keywords, some smaller search engines and internal site search tools still use them.',
        fix: 'Add <meta name="keywords" content="keyword1, keyword2, keyword3"> with 5-10 relevant keywords separated by commas.',
      };
    }

    return {
      check: 'Meta Keywords', category: 'meta-tags', status: 'pass', severity: 'low',
      message: `Meta keywords present (${keywords.split(',').length} keywords)`,
    };
  }

  _checkCanonicalUrl($, siteUrl) {
    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';

    if (!canonical) {
      return {
        check: 'Canonical URL', category: 'meta-tags', status: 'fail', severity: 'high',
        message: 'Canonical URL not set',
        impact: 'Search engines may index duplicate versions of your page (with/without www, trailing slashes, query parameters), splitting your ranking power across multiple URLs.',
        fix: 'Add <link rel="canonical" href="https://yourdomain.com/page-url"> in the <head> of every page, pointing to the preferred version of the URL.',
      };
    }

    try {
      const canonicalHost = new URL(canonical, siteUrl).hostname;
      const siteHost = new URL(siteUrl).hostname;
      if (canonicalHost !== siteHost) {
        return {
          check: 'Canonical URL', category: 'meta-tags', status: 'warn', severity: 'high',
          message: `Canonical URL points to different domain: ${canonicalHost}`,
          impact: 'Your page is telling search engines that the authoritative version lives on a different domain. This will transfer all ranking signals to that domain.',
          fix: `Verify this is intentional. If not, update the canonical URL to point to ${siteHost}.`,
          value: canonical,
        };
      }
    } catch {
      return {
        check: 'Canonical URL', category: 'meta-tags', status: 'warn', severity: 'high',
        message: 'Canonical URL could not be parsed',
        impact: 'An invalid canonical URL is ignored by search engines, leaving you vulnerable to duplicate content issues.',
        fix: 'Ensure the canonical URL is a valid, absolute URL (e.g., https://yourdomain.com/page).',
        value: canonical,
      };
    }

    return {
      check: 'Canonical URL', category: 'meta-tags', status: 'pass', severity: 'high',
      message: `Canonical URL set: ${canonical.substring(0, 80)}`,
      value: canonical,
    };
  }

  _checkRobotsMeta($) {
    const robots = $('meta[name="robots"]').attr('content')?.trim().toLowerCase() || '';

    if (!robots) {
      return {
        check: 'Robots Meta Tag', category: 'meta-tags', status: 'pass', severity: 'medium',
        message: 'No robots meta tag (defaults to index, follow)',
      };
    }

    if (robots.includes('noindex') && robots.includes('nofollow')) {
      return {
        check: 'Robots Meta Tag', category: 'meta-tags', status: 'fail', severity: 'medium',
        message: 'Robots meta set to noindex, nofollow',
        impact: 'This page is completely hidden from search engines. It will not appear in any search results and search engines won\'t follow any links on it.',
        fix: 'Remove the noindex and nofollow directives from the robots meta tag, unless you intentionally want this page hidden (e.g., admin pages, thank you pages).',
      };
    }

    if (robots.includes('noindex')) {
      return {
        check: 'Robots Meta Tag', category: 'meta-tags', status: 'warn', severity: 'medium',
        message: 'Robots meta set to noindex',
        impact: 'This page will not appear in search results. If this is your homepage or a key landing page, you are losing all organic traffic to it.',
        fix: 'Remove the noindex directive if you want this page to be discoverable via search engines.',
      };
    }

    return {
      check: 'Robots Meta Tag', category: 'meta-tags', status: 'pass', severity: 'medium',
      message: `Robots meta: ${robots}`,
    };
  }

  _checkOpenGraphTags($) {
    const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    const found = [];
    const missing = [];

    for (const tag of required) {
      if ($(`meta[property="${tag}"]`).attr('content')?.trim()) found.push(tag);
      else missing.push(tag);
    }

    if (found.length < 3) {
      return {
        check: 'Open Graph Tags', category: 'meta-tags', status: 'fail', severity: 'medium',
        message: `${found.length}/${required.length} Open Graph tags present`,
        impact: 'When your page is shared on Facebook, LinkedIn, or WhatsApp, it will display with a generic or broken preview — no image, no description, reducing shares and clicks.',
        fix: `Add the missing Open Graph tags: ${missing.join(', ')}. At minimum, include og:title, og:description, and og:image in your <head>.`,
        value: { found, missing },
      };
    }

    if (found.length < 5) {
      return {
        check: 'Open Graph Tags', category: 'meta-tags', status: 'warn', severity: 'medium',
        message: `${found.length}/${required.length} Open Graph tags present`,
        impact: 'Social media previews may be incomplete. Missing tags mean platforms will guess or omit information when your link is shared.',
        fix: `Add the missing tags: ${missing.join(', ')}. Each tag controls how your content appears on social platforms.`,
        value: { found, missing },
      };
    }

    return {
      check: 'Open Graph Tags', category: 'meta-tags', status: 'pass', severity: 'medium',
      message: `${found.length}/${required.length} Open Graph tags present`,
      value: { found, missing },
    };
  }

  _checkTwitterCardTags($) {
    const tags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    const found = [];
    const missing = [];

    for (const tag of tags) {
      const val = $(`meta[name="${tag}"]`).attr('content')?.trim()
        || $(`meta[property="${tag}"]`).attr('content')?.trim();
      if (val) found.push(tag);
      else missing.push(tag);
    }

    if (found.length === 0) {
      return {
        check: 'Twitter Card Tags', category: 'meta-tags', status: 'fail', severity: 'low',
        message: `${found.length}/${tags.length} Twitter Card tags present`,
        impact: 'Links shared on Twitter/X will show as plain text URLs with no preview image or description, resulting in much lower engagement.',
        fix: 'Add Twitter Card meta tags: <meta name="twitter:card" content="summary_large_image">, twitter:title, twitter:description, and twitter:image.',
        value: { found, missing },
      };
    }

    if (found.length < 4) {
      return {
        check: 'Twitter Card Tags', category: 'meta-tags', status: 'warn', severity: 'low',
        message: `${found.length}/${tags.length} Twitter Card tags present`,
        impact: 'Twitter/X previews will be incomplete. Missing tags may result in no image or a truncated description.',
        fix: `Add the missing tags: ${missing.join(', ')}. Use "summary_large_image" for twitter:card to get the best visual preview.`,
        value: { found, missing },
      };
    }

    return {
      check: 'Twitter Card Tags', category: 'meta-tags', status: 'pass', severity: 'low',
      message: `${found.length}/${tags.length} Twitter Card tags present`,
      value: { found, missing },
    };
  }

  _checkViewportMeta($) {
    const viewport = $('meta[name="viewport"]').attr('content')?.trim() || '';

    if (!viewport) {
      return {
        check: 'Viewport Meta Tag', category: 'meta-tags', status: 'fail', severity: 'medium',
        message: 'Viewport meta tag missing',
        impact: 'Your site will not render properly on mobile devices. Google uses mobile-first indexing, so this directly hurts your rankings.',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your <head> section.',
      };
    }

    return {
      check: 'Viewport Meta Tag', category: 'meta-tags', status: 'pass', severity: 'medium',
      message: 'Viewport meta tag present',
    };
  }

  _checkHreflangTags($) {
    const hreflangs = $('link[rel="alternate"][hreflang]');
    const count = hreflangs.length;

    if (count === 0) {
      return {
        check: 'Hreflang Tags', category: 'meta-tags', status: 'pass', severity: 'low',
        message: 'No hreflang tags (single-language site assumed)',
      };
    }

    const hasXDefault = hreflangs.filter((_, el) => $(el).attr('hreflang') === 'x-default').length > 0;

    if (!hasXDefault) {
      return {
        check: 'Hreflang Tags', category: 'meta-tags', status: 'warn', severity: 'low',
        message: `${count} hreflang tag(s) found (no x-default)`,
        impact: 'Users whose language doesn\'t match any hreflang variant may see the wrong version of your page, or Google may pick one arbitrarily.',
        fix: 'Add <link rel="alternate" hreflang="x-default" href="https://yourdomain.com/"> as a fallback for unmatched languages.',
        value: count,
      };
    }

    return {
      check: 'Hreflang Tags', category: 'meta-tags', status: 'pass', severity: 'low',
      message: `${count} hreflang tag(s) found (includes x-default)`,
      value: count,
    };
  }

  // ========== CONTENT CHECKS ==========

  _checkH1Tag($) {
    const h1Count = $('h1').length;

    if (h1Count === 0) {
      return {
        check: 'H1 Tag', category: 'content', status: 'fail', severity: 'high',
        message: 'No H1 tag found',
        impact: 'Search engines rely on the H1 as the primary heading to understand your page\'s main topic. Without it, your page loses a critical ranking signal.',
        fix: 'Add exactly one <h1> tag with your primary keyword as the main heading of the page (e.g., <h1>Best Running Shoes in India</h1>).',
      };
    }

    if (h1Count > 1) {
      return {
        check: 'H1 Tag', category: 'content', status: 'warn', severity: 'high',
        message: `${h1Count} H1 tags found (should be exactly 1)`,
        impact: 'Multiple H1 tags dilute the main topic signal. Search engines may get confused about which heading represents your primary content.',
        fix: 'Keep only one H1 tag for the main heading. Convert other H1 tags to H2 or H3 as subheadings.',
        value: h1Count,
      };
    }

    const text = $('h1').first().text().trim();
    return {
      check: 'H1 Tag', category: 'content', status: 'pass', severity: 'high',
      message: `H1 tag present: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
    };
  }

  _checkHeadingHierarchy($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      headings.push(parseInt(el.tagName.charAt(1), 10));
    });

    if (headings.length === 0) {
      return {
        check: 'Heading Hierarchy', category: 'content', status: 'warn', severity: 'medium',
        message: 'No headings found on the page',
        impact: 'Without headings, search engines and screen readers cannot understand your content structure, hurting both SEO and accessibility.',
        fix: 'Add heading tags (H1-H6) to organize your content into a logical hierarchy. Start with one H1, then use H2s for sections and H3s for subsections.',
      };
    }

    const skipped = [];
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i - 1] + 1) {
        skipped.push(`H${headings[i - 1]} -> H${headings[i]}`);
      }
    }

    if (skipped.length > 0) {
      return {
        check: 'Heading Hierarchy', category: 'content', status: 'warn', severity: 'medium',
        message: `Heading levels skipped: ${skipped.join(', ')}`,
        impact: 'Skipped heading levels (e.g., H1 directly to H3) confuse screen readers and make it harder for search engines to understand your content outline.',
        fix: `Fix the hierarchy so headings flow sequentially: H1 -> H2 -> H3. Don't skip levels. Currently skipping: ${skipped.join(', ')}.`,
        value: { headings, skipped },
      };
    }

    return {
      check: 'Heading Hierarchy', category: 'content', status: 'pass', severity: 'medium',
      message: `${headings.length} headings with proper hierarchy`,
      value: { count: headings.length },
    };
  }

  _checkImageAltText($) {
    const images = $('img');
    const total = images.length;

    if (total === 0) {
      return {
        check: 'Image Alt Text', category: 'content', status: 'pass', severity: 'medium',
        message: 'No images found to check',
      };
    }

    let withAlt = 0;
    images.each((_, el) => {
      if ($(el).attr('alt')?.trim()) withAlt++;
    });

    const pct = Math.round((withAlt / total) * 100);
    if (pct < 50) {
      return {
        check: 'Image Alt Text', category: 'content', status: 'fail', severity: 'medium',
        message: `${pct}% of images have alt text (${withAlt}/${total})`,
        impact: 'Most of your images are invisible to search engines and screen readers. You\'re missing out on image search traffic and failing accessibility standards.',
        fix: 'Add descriptive alt attributes to every meaningful image (e.g., alt="Red running shoes on a trail"). Use alt="" only for decorative images.',
        value: { total, withAlt, percentage: pct },
      };
    }

    if (pct < 90) {
      return {
        check: 'Image Alt Text', category: 'content', status: 'warn', severity: 'medium',
        message: `${pct}% of images have alt text (${withAlt}/${total})`,
        impact: 'Some images lack alt text, reducing your visibility in Google Image search and creating accessibility barriers for visually impaired users.',
        fix: `Add alt text to the remaining ${total - withAlt} image(s). Each alt should describe the image content concisely and include relevant keywords where natural.`,
        value: { total, withAlt, percentage: pct },
      };
    }

    return {
      check: 'Image Alt Text', category: 'content', status: 'pass', severity: 'medium',
      message: `${pct}% of images have alt text (${withAlt}/${total})`,
      value: { total, withAlt, percentage: pct },
    };
  }

  _checkKeywordDensity($) {
    const text = $('body').text().replace(/\s+/g, ' ').trim().toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    const totalWords = words.length;

    if (totalWords < 50) {
      return {
        check: 'Keyword Density', category: 'content', status: 'warn', severity: 'low',
        message: 'Not enough content to analyze keyword density',
        impact: 'Too little text content means search engines have very little to index and rank your page for.',
        fix: 'Add more substantive text content to your page. Aim for at least 300 words of meaningful content.',
        value: { totalWords },
      };
    }

    const freq = {};
    for (const w of words) { freq[w] = (freq[w] || 0) + 1; }

    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word, count,
        density: parseFloat(((count / totalWords) * 100).toFixed(2)),
      }));

    const stuffed = topWords.filter((w) => w.density > 3);

    if (stuffed.length > 0) {
      return {
        check: 'Keyword Density', category: 'content', status: 'warn', severity: 'low',
        message: `Possible keyword stuffing: ${stuffed.map((w) => `"${w.word}" (${w.density}%)`).join(', ')}`,
        impact: 'Keyword stuffing can trigger Google penalties, causing your page to drop in rankings or be removed from search results entirely.',
        fix: `Reduce the density of overused words to below 3%. Rewrite sentences to use synonyms and natural variations instead of repeating "${stuffed[0].word}" excessively.`,
        value: { topWords, totalWords },
      };
    }

    return {
      check: 'Keyword Density', category: 'content', status: 'pass', severity: 'low',
      message: `Top keywords well-distributed (max density: ${topWords[0]?.density || 0}%)`,
      value: { topWords, totalWords },
    };
  }

  _checkContentLength($) {
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    if (wordCount < 300) {
      return {
        check: 'Content Length', category: 'content', status: 'fail', severity: 'medium',
        message: `${wordCount} words on page`,
        impact: 'Pages with less than 300 words are flagged as "thin content" by Google. They rarely rank for competitive keywords and may be deprioritized.',
        fix: 'Add more valuable, in-depth content. Aim for at least 600 words covering your topic thoroughly. Include FAQs, examples, or detailed explanations.',
        value: wordCount,
      };
    }

    if (wordCount < 600) {
      return {
        check: 'Content Length', category: 'content', status: 'warn', severity: 'medium',
        message: `${wordCount} words on page`,
        impact: 'Pages with under 600 words may rank lower than more comprehensive competitor pages covering the same topic.',
        fix: 'Expand your content with additional sections, examples, FAQs, or deeper explanations to reach 600+ words.',
        value: wordCount,
      };
    }

    return {
      check: 'Content Length', category: 'content', status: 'pass', severity: 'medium',
      message: `${wordCount} words on page`,
      value: wordCount,
    };
  }

  _checkStructuredData($) {
    const ldJsonScripts = $('script[type="application/ld+json"]');
    const count = ldJsonScripts.length;

    if (count === 0) {
      return {
        check: 'Structured Data', category: 'content', status: 'warn', severity: 'medium',
        message: 'No structured data (JSON-LD) found',
        impact: 'Without structured data, you miss out on rich snippets in search results (star ratings, price, FAQ accordions, breadcrumbs) which can increase CTR by 20-30%.',
        fix: 'Add JSON-LD structured data in a <script type="application/ld+json"> block. Start with Organization, WebSite, or Article schema depending on your page type. Use Google\'s Structured Data Markup Helper.',
      };
    }

    let valid = 0;
    let invalid = 0;
    ldJsonScripts.each((_, el) => {
      try { JSON.parse($(el).html()); valid++; } catch { invalid++; }
    });

    if (invalid > 0) {
      return {
        check: 'Structured Data', category: 'content', status: 'warn', severity: 'medium',
        message: `${count} JSON-LD block(s) found, ${invalid} invalid`,
        impact: 'Invalid JSON-LD is ignored by search engines, so you lose the rich snippet benefits you intended to gain.',
        fix: 'Fix the JSON syntax in your structured data blocks. Use Google\'s Rich Results Test (search.google.com/test/rich-results) to validate.',
        value: { total: count, valid, invalid },
      };
    }

    return {
      check: 'Structured Data', category: 'content', status: 'pass', severity: 'medium',
      message: `${count} valid JSON-LD block(s) found`,
      value: { total: count, valid, invalid },
    };
  }

  // ========== LINK CHECKS ==========

  _checkInternalLinks($, siteUrl) {
    const siteHost = new URL(siteUrl).hostname;
    let count = 0;

    $('a[href]').each((_, el) => {
      try {
        const resolved = new URL($(el).attr('href'), siteUrl);
        if (resolved.hostname === siteHost) count++;
      } catch { /* skip */ }
    });

    if (count < 3) {
      return {
        check: 'Internal Links', category: 'links', status: 'warn', severity: 'low',
        message: `${count} internal link(s) found`,
        impact: 'Too few internal links make it harder for search engines to discover and crawl your other pages, and reduce the link equity flowing through your site.',
        fix: 'Add internal links to your other relevant pages. Link to related blog posts, service pages, or category pages using descriptive anchor text.',
        value: count,
      };
    }

    return {
      check: 'Internal Links', category: 'links', status: 'pass', severity: 'low',
      message: `${count} internal link(s) found`,
      value: count,
    };
  }

  _checkExternalLinks($, siteUrl) {
    const siteHost = new URL(siteUrl).hostname;
    let count = 0;

    $('a[href]').each((_, el) => {
      try {
        const resolved = new URL($(el).attr('href'), siteUrl);
        if (resolved.hostname !== siteHost && resolved.protocol.startsWith('http')) count++;
      } catch { /* skip */ }
    });

    return {
      check: 'External Links', category: 'links', status: 'pass', severity: 'low',
      message: `${count} external link(s) found`,
      value: count,
    };
  }

  async _checkBrokenLinks($, siteUrl) {
    const origin = new URL(siteUrl).origin;
    const hostname = new URL(siteUrl).hostname;
    const links = new Set();

    $('a[href]').each((_, el) => {
      if (links.size >= 10) return false;
      try {
        const resolved = new URL($(el).attr('href'), origin);
        if (resolved.hostname === hostname && resolved.pathname !== '/') links.add(resolved.href);
      } catch { /* skip */ }
    });

    if (links.size === 0) {
      return {
        check: 'Broken Links', category: 'links', status: 'pass', severity: 'medium',
        message: 'No internal links to check',
      };
    }

    const linkArray = [...links].slice(0, 10);
    let broken = 0;
    const brokenPaths = [];

    for (let i = 0; i < linkArray.length; i += 5) {
      const batch = linkArray.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map((url) => this._httpHead(url)));
      for (let j = 0; j < results.length; j++) {
        const code = results[j].status === 'fulfilled' ? results[j].value.statusCode : 0;
        if (code === 404 || code >= 500 || code === 0) {
          broken++;
          brokenPaths.push(new URL(batch[j]).pathname);
        }
      }
    }

    if (broken > 0) {
      return {
        check: 'Broken Links', category: 'links', status: 'fail', severity: 'medium',
        message: `${broken} of ${linkArray.length} sampled internal links are broken`,
        impact: 'Broken links create dead ends for both users and search engine crawlers, wasting crawl budget and causing visitors to leave your site.',
        fix: `Fix or remove these broken links: ${brokenPaths.join(', ')}. Set up 301 redirects for moved pages, or update the href to the correct URL.`,
        value: { checked: linkArray.length, broken, brokenPaths },
      };
    }

    return {
      check: 'Broken Links', category: 'links', status: 'pass', severity: 'medium',
      message: `All ${linkArray.length} sampled internal links are accessible`,
      value: { checked: linkArray.length, broken: 0 },
    };
  }

  _checkNofollowUsage($) {
    const allLinks = $('a[href]');
    const total = allLinks.length;

    if (total === 0) {
      return {
        check: 'Nofollow Usage', category: 'links', status: 'pass', severity: 'low',
        message: 'No links found to check',
      };
    }

    let nofollowCount = 0;
    allLinks.each((_, el) => {
      if (($(el).attr('rel') || '').toLowerCase().includes('nofollow')) nofollowCount++;
    });

    const pct = Math.round((nofollowCount / total) * 100);

    if (pct > 50) {
      return {
        check: 'Nofollow Usage', category: 'links', status: 'warn', severity: 'low',
        message: `${nofollowCount}/${total} links are nofollow (${pct}%)`,
        impact: 'Over half your links are nofollow, meaning you\'re not passing link equity to those pages. This limits the SEO benefit of your internal linking strategy.',
        fix: 'Remove rel="nofollow" from internal links and legitimate external links. Only use nofollow for user-generated content, paid links, or untrusted sources.',
        value: { total, nofollow: nofollowCount, percentage: pct },
      };
    }

    return {
      check: 'Nofollow Usage', category: 'links', status: 'pass', severity: 'low',
      message: `${nofollowCount}/${total} links are nofollow (${pct}%)`,
      value: { total, nofollow: nofollowCount, percentage: pct },
    };
  }

  _checkSocialMediaLinks($) {
    const found = [];

    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').toLowerCase();
      for (const domain of SOCIAL_DOMAINS) {
        if (href.includes(domain) && !found.includes(domain)) found.push(domain);
      }
    });

    if (found.length === 0) {
      return {
        check: 'Social Media Links', category: 'links', status: 'warn', severity: 'low',
        message: 'No social media links detected',
        impact: 'Missing social links reduce your brand\'s discoverability and make it harder for visitors to follow or share your content on social platforms.',
        fix: 'Add links to your active social media profiles (Facebook, Twitter/X, Instagram, LinkedIn, YouTube) in the header or footer of your site.',
        value: found,
      };
    }

    return {
      check: 'Social Media Links', category: 'links', status: 'pass', severity: 'low',
      message: `Social links found: ${found.join(', ')}`,
      value: found,
    };
  }

  // ========== PAGESPEED API ==========

  async _fetchPageSpeedData(siteUrl, existingCacheDate) {
    if (!config.pageSpeedApiKey) {
      throw new Error('PAGESPEED_API_KEY not configured on server');
    }

    if (existingCacheDate) {
      const cacheAge = Date.now() - new Date(existingCacheDate).getTime();
      if (cacheAge < 6 * 60 * 60 * 1000) return null;
    }

    logger.info(`PageSpeed: fetching data for ${siteUrl}`);

    const apiKey = config.pageSpeedApiKey;
    const baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

    const buildUrl = (strategy) => {
      let url = `${baseUrl}?url=${encodeURIComponent(siteUrl)}&strategy=${strategy}`;
      url += '&category=performance&category=accessibility&category=best-practices&category=seo';
      if (apiKey) url += `&key=${apiKey}`;
      return url;
    };

    const fetchStrategy = async (strategy) => {
      logger.info(`PageSpeed: requesting ${strategy} for ${siteUrl}`);
      const res = await fetch(buildUrl(strategy), { signal: AbortSignal.timeout(60000) });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`PageSpeed API returned ${res.status} for ${strategy}: ${body.slice(0, 200)}`);
      }
      return res.json();
    };

    const [mobileResult, desktopResult] = await Promise.allSettled([
      fetchStrategy('mobile'),
      fetchStrategy('desktop'),
    ]);

    if (mobileResult.status === 'rejected') {
      logger.error(`PageSpeed mobile failed: ${mobileResult.reason?.message}`);
    }
    if (desktopResult.status === 'rejected') {
      logger.error(`PageSpeed desktop failed: ${desktopResult.reason?.message}`);
    }

    const extractData = (data) => {
      if (!data?.lighthouseResult) return null;
      const cats = data.lighthouseResult.categories;
      const audits = data.lighthouseResult.audits || {};
      return {
        performance: Math.round((cats?.performance?.score || 0) * 100),
        accessibility: Math.round((cats?.accessibility?.score || 0) * 100),
        bestPractices: Math.round((cats?.['best-practices']?.score || 0) * 100),
        seo: Math.round((cats?.seo?.score || 0) * 100),
        fcp: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : null,
        lcp: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null,
        tbt: audits['total-blocking-time']?.numericValue != null ? Math.round(audits['total-blocking-time'].numericValue) : null,
        cls: audits['cumulative-layout-shift']?.numericValue ?? null,
        si: audits['speed-index']?.numericValue ? Math.round(audits['speed-index'].numericValue) : null,
        inp: audits['interaction-to-next-paint']?.numericValue ? Math.round(audits['interaction-to-next-paint'].numericValue) : null,
        fid: audits['max-potential-fid']?.numericValue ? Math.round(audits['max-potential-fid'].numericValue) : null,
        ttfb: audits['server-response-time']?.numericValue ? Math.round(audits['server-response-time'].numericValue) : null,
      };
    };

    const mobile = mobileResult.status === 'fulfilled' ? extractData(mobileResult.value) : null;
    const desktop = desktopResult.status === 'fulfilled' ? extractData(desktopResult.value) : null;

    if (!mobile && !desktop) {
      const mobileErr = mobileResult.status === 'rejected' ? mobileResult.reason?.message : 'no data';
      const desktopErr = desktopResult.status === 'rejected' ? desktopResult.reason?.message : 'no data';
      throw new Error(`Both strategies failed — mobile: ${mobileErr}; desktop: ${desktopErr}`);
    }

    logger.info(`PageSpeed: success for ${siteUrl} (mobile: ${!!mobile}, desktop: ${!!desktop})`);

    return { mobile, desktop, fetchedAt: new Date() };
  }

  _generatePageSpeedChecks(pageSpeed) {
    const checks = [];
    const scores = pageSpeed.mobile || pageSpeed.desktop;

    if (scores) {
      checks.push(this._lighthouseCheck('Lighthouse Performance', scores.performance, 'high',
        'Slow performance leads to higher bounce rates — 53% of mobile users leave pages that take over 3 seconds to load.',
        'Optimize images (use WebP), enable lazy loading, minify CSS/JS, and use a CDN. Run a full Lighthouse audit for specific recommendations.'));
      checks.push(this._lighthouseCheck('Lighthouse Accessibility', scores.accessibility, 'medium',
        'Poor accessibility excludes users with disabilities and can expose you to legal compliance issues. Google also uses accessibility as a ranking signal.',
        'Add ARIA labels, ensure sufficient color contrast (4.5:1 ratio), make all interactive elements keyboard-accessible, and add alt text to images.'));
      checks.push(this._lighthouseCheck('Lighthouse Best Practices', scores.bestPractices, 'medium',
        'Failing best practices indicates security vulnerabilities, deprecated APIs, or browser compatibility issues that erode user trust.',
        'Use HTTPS everywhere, update deprecated APIs, avoid document.write, and ensure images have correct aspect ratios.'));
      checks.push(this._lighthouseCheck('Lighthouse SEO', scores.seo, 'medium',
        'A low Lighthouse SEO score means basic SEO best practices are not met, directly reducing your search engine visibility.',
        'Ensure crawlable links, add meta descriptions, use legible font sizes, and configure a proper robots.txt.'));
    }

    const cwv = pageSpeed.mobile || pageSpeed.desktop;
    if (cwv) {
      if (cwv.lcp != null) checks.push(this._cwvCheck('LCP (Largest Contentful Paint)', cwv.lcp, 'ms', 2500, 4000, 'high',
        'Slow LCP means your main content takes too long to appear. Users may leave before seeing your page, and Google demotes slow pages in rankings.',
        'Optimize your largest visible element (usually a hero image or heading). Use next-gen image formats, preload critical resources, and improve server response time.'));
      if (cwv.cls != null) checks.push(this._cwvCheck('CLS (Cumulative Layout Shift)', cwv.cls, '', 0.1, 0.25, 'high',
        'Layout shifts frustrate users as content jumps around while loading. This hurts user experience and is a Google Core Web Vital ranking factor.',
        'Set explicit width/height on images and videos, avoid inserting content above existing content, and use CSS transform animations instead of layout-triggering properties.'));
      if (cwv.inp != null) checks.push(this._cwvCheck('INP (Interaction to Next Paint)', cwv.inp, 'ms', 200, 500, 'high',
        'Slow interactivity means users experience lag when clicking buttons or typing. This replaced FID as a Core Web Vital ranking signal.',
        'Break up long JavaScript tasks, use web workers for heavy computation, optimize event handlers, and reduce third-party script impact.'));
      if (cwv.ttfb != null) checks.push(this._cwvCheck('TTFB (Time to First Byte)', cwv.ttfb, 'ms', 800, 1800, 'medium',
        'Slow TTFB indicates server-side issues. Everything else (rendering, loading) is delayed until the first byte arrives.',
        'Optimize server-side code, use a CDN, enable server-side caching, upgrade your hosting if needed, and reduce redirect chains.'));
    }

    return checks;
  }

  _lighthouseCheck(name, score, severity, impactText, fixText) {
    let status = 'pass';
    if (score < 50) status = 'fail';
    else if (score < 90) status = 'warn';

    return {
      check: name, category: 'performance', status, severity,
      message: `${name}: ${score}/100`,
      impact: status !== 'pass' ? impactText : null,
      fix: status !== 'pass' ? fixText : null,
      value: score,
    };
  }

  _cwvCheck(name, value, unit, goodThreshold, poorThreshold, severity, impactText, fixText) {
    let status = 'pass';
    let label = 'Good';
    if (value > poorThreshold) { status = 'fail'; label = 'Poor'; }
    else if (value > goodThreshold) { status = 'warn'; label = 'Needs Improvement'; }

    const displayValue = unit === 'ms'
      ? (value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`)
      : value.toFixed(3);

    return {
      check: name, category: 'performance', status, severity,
      message: `${name}: ${displayValue} (${label})`,
      impact: status !== 'pass' ? impactText : null,
      fix: status !== 'pass' ? fixText : null,
      value,
    };
  }

  // ========== SCORE CALCULATION ==========

  _calculateScores(checks) {
    const byCategory = { 'meta-tags': [], content: [], links: [], performance: [] };
    for (const check of checks) {
      if (byCategory[check.category]) byCategory[check.category].push(check);
    }

    const weights = { critical: 4, high: 3, medium: 2, low: 1 };

    const calcCategoryScore = (categoryChecks) => {
      if (categoryChecks.length === 0) return 0;
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

    const metaTagsScore = calcCategoryScore(byCategory['meta-tags']);
    const contentScore = calcCategoryScore(byCategory.content);
    const linksScore = calcCategoryScore(byCategory.links);
    const performanceScore = calcCategoryScore(byCategory.performance);

    const score = Math.round(
      metaTagsScore * 0.30 + contentScore * 0.25 + linksScore * 0.15 + performanceScore * 0.30
    );

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === 'pass').length;
    const failedChecks = checks.filter((c) => c.status === 'fail').length;
    const warnChecks = checks.filter((c) => c.status === 'warn').length;

    return { score, metaTagsScore, contentScore, linksScore, performanceScore, totalChecks, passedChecks, failedChecks, warnChecks };
  }

  // ========== HTTP HELPERS ==========

  _httpGetTimed(url) { return proxy.httpGetTimed(url, { timeout: 15000 }); }
  _httpHead(url) { return proxy.httpHead(url, { timeout: 5000 }); }
}

module.exports = new SeoService();
