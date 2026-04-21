const Site = require('../models/Site');
const AppSettings = require('../models/AppSettings');
const backlinksService = require('../services/backlinks/backlinks.service');

function buildQuotaInfo(site, limit, currentMonthKey) {
  const used = site.backlinks?.monthKey === currentMonthKey
    ? (site.backlinks.refreshCountThisMonth || 0)
    : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    monthKey: currentMonthKey,
  };
}

exports.getStatus = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();
    const currentMonthKey = backlinksService.currentMonthKey();

    const bl = site.backlinks || {};
    const lastFetchedAt = bl.lastFetchedAt || null;

    res.json({
      success: true,
      data: {
        backlinks: {
          domainRank: bl.domainRank || 0,
          backlinksCount: bl.backlinksCount || 0,
          referringDomains: bl.referringDomains || 0,
          newLinksLast30d: bl.newLinksLast30d || 0,
          lostLinksLast30d: bl.lostLinksLast30d || 0,
          providerName: bl.providerName || null,
          providerMetric: bl.providerMetric || null,
          lastFetchedAt,
          fetchError: bl.fetchError || null,
          items: bl.items || [],
          listFetchedAt: bl.listFetchedAt || null,
          listFetchError: bl.listFetchError || null,
          history: bl.history || [],
          historyFetchedAt: bl.historyFetchedAt || null,
          historyFetchError: bl.historyFetchError || null,
        },
        isStale: backlinksService.isStale(lastFetchedAt),
        hasData: !!lastFetchedAt,
        quota: buildQuotaInfo(site, settings.backlinksMonthlyLimit, currentMonthKey),
        providerInfo: backlinksService.getProviderInfo(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();
    const limit = settings.backlinksMonthlyLimit;
    const currentMonthKey = backlinksService.currentMonthKey();

    // Reset counter if month changed
    const currentCount = site.backlinks?.monthKey === currentMonthKey
      ? (site.backlinks.refreshCountThisMonth || 0)
      : 0;

    // Quota check
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

    // Check provider is configured
    const providerInfo = backlinksService.getProviderInfo();
    if (!providerInfo.configured) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: `Backlinks provider '${providerInfo.name}' is not configured. Check server environment variables.`,
        },
      });
    }

    // Fetch from provider
    let summary;
    try {
      summary = await backlinksService.fetchSummary(site.url);
    } catch (err) {
      // Save error on site, return appropriate status
      await Site.findByIdAndUpdate(site._id, {
        'backlinks.fetchError': err.message,
      });

      const status = err.statusCode || 502;
      return res.status(status).json({
        success: false,
        error: {
          code: err.code || 'FETCH_FAILED',
          message: err.message,
        },
      });
    }

    // Also fetch per-link list. Partial failure allowed: summary still commits
    // even if list fetch fails (e.g. provider doesn't support listing, or network error).
    // Quota still increments by 1 — the refresh click is a single user-facing action.
    let listItems = null;
    let listFetchError = null;
    try {
      const list = await backlinksService.fetchBacklinksList(site.url, { limit: 100 });
      listItems = list.items;
    } catch (err) {
      console.warn('[Backlinks] List fetch failed (summary committed):', err.message);
      listFetchError = err.message;
    }

    // Also fetch monthly history (24 months). Same partial-failure semantics.
    let historyItems = null;
    let historyFetchError = null;
    try {
      const hist = await backlinksService.fetchHistory(site.url, { months: 24 });
      historyItems = hist.history;
    } catch (err) {
      console.warn('[Backlinks] History fetch failed (summary committed):', err.message);
      historyFetchError = err.message;
    }

    // Save data + increment counter
    const now = new Date();
    const newCount = currentCount + 1;
    const update = {
      'backlinks.domainRank': summary.domainRank,
      'backlinks.backlinksCount': summary.backlinksCount,
      'backlinks.referringDomains': summary.referringDomains,
      'backlinks.newLinksLast30d': summary.newLinksLast30d,
      'backlinks.lostLinksLast30d': summary.lostLinksLast30d,
      'backlinks.providerName': summary.providerName,
      'backlinks.providerMetric': summary.providerMetric,
      'backlinks.lastFetchedAt': now,
      'backlinks.fetchError': null,
      'backlinks.refreshCountThisMonth': newCount,
      'backlinks.monthKey': currentMonthKey,
    };
    if (listItems) {
      update['backlinks.items'] = listItems;
      update['backlinks.listFetchedAt'] = now;
      update['backlinks.listFetchError'] = null;
    } else {
      update['backlinks.listFetchError'] = listFetchError;
    }
    if (historyItems) {
      update['backlinks.history'] = historyItems;
      update['backlinks.historyFetchedAt'] = now;
      update['backlinks.historyFetchError'] = null;
    } else {
      update['backlinks.historyFetchError'] = historyFetchError;
    }

    await Site.findByIdAndUpdate(site._id, update);

    // Read existing items if list/history fetch failed (so response is consistent with DB)
    const existingItems = site.backlinks?.items || [];
    const existingListFetchedAt = site.backlinks?.listFetchedAt || null;
    const existingHistory = site.backlinks?.history || [];
    const existingHistoryFetchedAt = site.backlinks?.historyFetchedAt || null;

    res.json({
      success: true,
      data: {
        backlinks: {
          domainRank: summary.domainRank,
          backlinksCount: summary.backlinksCount,
          referringDomains: summary.referringDomains,
          newLinksLast30d: summary.newLinksLast30d,
          lostLinksLast30d: summary.lostLinksLast30d,
          providerName: summary.providerName,
          providerMetric: summary.providerMetric,
          lastFetchedAt: now,
          fetchError: null,
          items: listItems || existingItems,
          listFetchedAt: listItems ? now : existingListFetchedAt,
          listFetchError,
          history: historyItems || existingHistory,
          historyFetchedAt: historyItems ? now : existingHistoryFetchedAt,
          historyFetchError,
        },
        isStale: false,
        hasData: true,
        quota: {
          used: newCount,
          limit,
          remaining: Math.max(0, limit - newCount),
          monthKey: currentMonthKey,
        },
        providerInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};
