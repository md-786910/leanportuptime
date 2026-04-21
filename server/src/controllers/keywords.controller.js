const Site = require('../models/Site');
const AppSettings = require('../models/AppSettings');
const config = require('../config');
const keywordsService = require('../services/keywords/keywords.service');

function buildQuotaInfo(site, limit, currentMonthKey) {
  const used = site.keywords?.monthKey === currentMonthKey
    ? (site.keywords.refreshCountThisMonth || 0)
    : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    monthKey: currentMonthKey,
  };
}

function normalizeKw(kw) {
  return (kw || '').trim().toLowerCase();
}

function serializeItem(item) {
  if (!item) return null;
  return {
    keyword: item.keyword,
    position: item.position ?? null,
    previousPosition: item.previousPosition ?? null,
    url: item.url || null,
    searchVolume: item.searchVolume ?? null,
    keywordDifficulty: item.keywordDifficulty ?? null,
    cpc: item.cpc ?? null,
    competition: item.competition ?? null,
    monthlySearches: item.monthlySearches || [],
    locationCode: item.locationCode ?? config.keywords.defaultLocationCode,
    languageCode: item.languageCode ?? config.keywords.defaultLanguageCode,
    addedAt: item.addedAt || null,
    addedBy: item.addedBy || null,
    lastCheckedAt: item.lastCheckedAt || null,
    lastCheckError: item.lastCheckError || null,
    history: item.history || [],
  };
}

exports.getStatus = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();
    const currentMonthKey = keywordsService.currentMonthKey();
    const kw = site.keywords || {};

    res.json({
      success: true,
      data: {
        items: (kw.items || []).map(serializeItem),
        providerName: kw.providerName || null,
        lastFetchedAt: kw.lastFetchedAt || null,
        fetchError: kw.fetchError || null,
        quota: buildQuotaInfo(site, settings.keywordsMonthlyLimit, currentMonthKey),
        maxKeywordsPerSite: settings.maxKeywordsPerSite,
        providerInfo: keywordsService.getProviderInfo(),
        providerConfig: {
          locationCode: config.keywords.defaultLocationCode,
          languageCode: config.keywords.defaultLanguageCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.addKeyword = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();

    const raw = typeof req.body?.keyword === 'string' ? req.body.keyword.trim() : '';
    if (!raw) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_KEYWORD', message: 'Keyword is required' },
      });
    }
    if (raw.length > 80) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_KEYWORD', message: 'Keyword must be 80 characters or fewer' },
      });
    }

    const items = site.keywords?.items || [];
    if (items.length >= settings.maxKeywordsPerSite) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_REACHED',
          message: `Maximum of ${settings.maxKeywordsPerSite} keywords per site. Remove one before adding another.`,
        },
      });
    }

    const normalized = normalizeKw(raw);
    const duplicate = items.some((it) => normalizeKw(it.keyword) === normalized);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'This keyword is already tracked for this site' },
      });
    }

    const newItem = {
      keyword: raw,
      position: null,
      previousPosition: null,
      url: null,
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      competition: null,
      monthlySearches: [],
      locationCode: config.keywords.defaultLocationCode,
      languageCode: config.keywords.defaultLanguageCode,
      addedAt: new Date(),
      addedBy: req.user?.email || req.user?.id || null,
      lastCheckedAt: null,
      lastCheckError: null,
      history: [],
    };

    await Site.findByIdAndUpdate(site._id, {
      $push: { 'keywords.items': newItem },
    });

    res.json({ success: true, data: { item: serializeItem(newItem) } });
  } catch (error) {
    next(error);
  }
};

exports.addKeywordsBulk = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();

    const raw = Array.isArray(req.body?.keywords) ? req.body.keywords : null;
    if (!raw || raw.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Provide at least one keyword in "keywords" array' },
      });
    }

    const existing = site.keywords?.items || [];
    const existingSet = new Set(existing.map((it) => normalizeKw(it.keyword)));
    const seenInBatch = new Set();

    const added = [];
    const skipped = [];
    let slotsLeft = settings.maxKeywordsPerSite - existing.length;

    for (const entry of raw) {
      const trimmed = typeof entry === 'string' ? entry.trim() : '';
      if (!trimmed) {
        skipped.push({ keyword: typeof entry === 'string' ? entry : '', reason: 'empty' });
        continue;
      }
      if (trimmed.length > 80) {
        skipped.push({ keyword: trimmed, reason: 'too_long' });
        continue;
      }
      const normalized = normalizeKw(trimmed);
      if (existingSet.has(normalized) || seenInBatch.has(normalized)) {
        skipped.push({ keyword: trimmed, reason: 'duplicate' });
        continue;
      }
      if (slotsLeft <= 0) {
        skipped.push({ keyword: trimmed, reason: 'limit_reached' });
        continue;
      }
      seenInBatch.add(normalized);
      added.push({
        keyword: trimmed,
        position: null,
        previousPosition: null,
        url: null,
        searchVolume: null,
        keywordDifficulty: null,
        cpc: null,
        competition: null,
        monthlySearches: [],
        locationCode: config.keywords.defaultLocationCode,
        languageCode: config.keywords.defaultLanguageCode,
        addedAt: new Date(),
        addedBy: req.user?.email || req.user?.id || null,
        lastCheckedAt: null,
        lastCheckError: null,
        history: [],
      });
      slotsLeft -= 1;
    }

    if (added.length > 0) {
      await Site.findByIdAndUpdate(site._id, {
        $push: { 'keywords.items': { $each: added } },
      });
    }

    res.json({
      success: true,
      data: {
        added: added.map(serializeItem),
        skipped,
        summary: {
          requested: raw.length,
          addedCount: added.length,
          skippedCount: skipped.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.removeKeyword = async (req, res, next) => {
  try {
    const site = req.site;
    const target = normalizeKw(decodeURIComponent(req.params.keyword || ''));
    if (!target) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_KEYWORD', message: 'Keyword is required' },
      });
    }

    const items = site.keywords?.items || [];
    const match = items.find((it) => normalizeKw(it.keyword) === target);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Keyword not found for this site' },
      });
    }

    await Site.findByIdAndUpdate(site._id, {
      $pull: { 'keywords.items': { keyword: match.keyword } },
    });

    res.json({ success: true, data: { removed: match.keyword } });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();
    const limit = settings.keywordsMonthlyLimit;
    const currentMonthKey = keywordsService.currentMonthKey();

    const currentCount = site.keywords?.monthKey === currentMonthKey
      ? (site.keywords.refreshCountThisMonth || 0)
      : 0;

    if (currentCount >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Monthly refresh limit reached (${currentCount}/${limit}). Increase in settings to allow more refreshes.`,
          used: currentCount,
          limit,
        },
      });
    }

    const providerInfo = keywordsService.getProviderInfo();
    if (!providerInfo.configured) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: `Keywords provider '${providerInfo.name}' is not configured. Check server environment variables.`,
        },
      });
    }

    const items = site.keywords?.items || [];
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_KEYWORDS',
          message: 'No keywords to refresh. Add at least one keyword first.',
        },
      });
    }

    const locationCode = config.keywords.defaultLocationCode;
    const languageCode = config.keywords.defaultLanguageCode;
    const targetDomain = site.url;
    const historyMax = config.keywords.historyMaxEntries;

    // (a) Batched metrics call
    let metricsMap = {};
    let metricsFetchError = null;
    try {
      const keywords = items.map((it) => it.keyword);
      const result = await keywordsService.fetchMetrics(keywords, { locationCode, languageCode });
      metricsMap = result.map || {};
    } catch (err) {
      console.warn('[Keywords] Metrics fetch failed (SERP updates still proceed):', err.message);
      metricsFetchError = err.message;
    }

    // (b) Per-keyword SERP calls
    const now = new Date();
    const settled = await Promise.allSettled(
      items.map((it) =>
        keywordsService.fetchRank(it.keyword, { locationCode, languageCode, targetDomain })
      )
    );

    const updatedItems = items.map((it, idx) => {
      const rankResult = settled[idx];
      const metrics = metricsMap[it.keyword];
      const base = {
        keyword: it.keyword,
        locationCode: it.locationCode || locationCode,
        languageCode: it.languageCode || languageCode,
        addedAt: it.addedAt,
        addedBy: it.addedBy,
        history: Array.isArray(it.history) ? [...it.history] : [],

        // Carry over existing metrics if this refresh didn't return fresh ones
        searchVolume: it.searchVolume ?? null,
        keywordDifficulty: it.keywordDifficulty ?? null,
        cpc: it.cpc ?? null,
        competition: it.competition ?? null,
        monthlySearches: it.monthlySearches || [],
      };

      if (metrics) {
        base.searchVolume = metrics.searchVolume;
        base.keywordDifficulty = metrics.keywordDifficulty;
        base.cpc = metrics.cpc;
        base.competition = metrics.competition;
        base.monthlySearches = metrics.monthlySearches;
      }

      if (rankResult.status === 'fulfilled') {
        const { position, url } = rankResult.value;
        base.previousPosition = it.position ?? null;
        base.position = position;
        base.url = url;
        base.lastCheckedAt = now;
        base.lastCheckError = null;
        base.history.push({ position, url, checkedAt: now });
        if (base.history.length > historyMax) {
          base.history = base.history.slice(base.history.length - historyMax);
        }
      } else {
        // Keep prior rank; record error
        base.previousPosition = it.previousPosition ?? null;
        base.position = it.position ?? null;
        base.url = it.url || null;
        base.lastCheckedAt = it.lastCheckedAt || null;
        base.lastCheckError = rankResult.reason?.message || 'SERP fetch failed';
      }

      return base;
    });

    const newCount = currentCount + 1;
    await Site.findByIdAndUpdate(site._id, {
      'keywords.items': updatedItems,
      'keywords.providerName': providerInfo.name,
      'keywords.lastFetchedAt': now,
      'keywords.fetchError': metricsFetchError,
      'keywords.refreshCountThisMonth': newCount,
      'keywords.monthKey': currentMonthKey,
    });

    const successCount = settled.filter((s) => s.status === 'fulfilled').length;
    const failCount = settled.length - successCount;

    res.json({
      success: true,
      data: {
        items: updatedItems.map(serializeItem),
        providerName: providerInfo.name,
        lastFetchedAt: now,
        fetchError: metricsFetchError,
        summary: { total: settled.length, successCount, failCount },
        quota: {
          used: newCount,
          limit,
          remaining: Math.max(0, limit - newCount),
          monthKey: currentMonthKey,
        },
        maxKeywordsPerSite: settings.maxKeywordsPerSite,
        providerInfo,
        providerConfig: { locationCode, languageCode },
      },
    });
  } catch (error) {
    next(error);
  }
};
