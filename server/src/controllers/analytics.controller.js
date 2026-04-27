const analyticsService = require('../services/analytics.service');
const Site = require('../models/Site');
const resolveGoogleUser = require('../utils/resolveGoogleUser');

/**
 * Compute date range from a period string.
 * GA4 data is near-real-time, so "today" is a safe endDate.
 */
function dateRange(period) {
  const end = new Date();
  const start = new Date(end);

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 6);
      break;
    case '2m':
      start.setDate(start.getDate() - 59);
      break;
    case '28d':
    default:
      start.setDate(start.getDate() - 27);
      break;
  }

  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

exports.getStatus = async (req, res, next) => {
  try {
    const site = req.site;
    // Viewers inherit the site owner's Google connection
    const effectiveUser = await resolveGoogleUser(req);
    const googleConnected = !!(effectiveUser?.google && effectiveUser.google.connectedAt);
    const linked = !!(site.analytics && site.analytics.propertyId);

    res.json({
      success: true,
      data: {
        googleConnected,
        linked,
        propertyId: site.analytics?.propertyId || null,
        propertyName: site.analytics?.propertyName || null,
        connectedAt: site.analytics?.connectedAt || null,
        filters: {
          excludedCountries: site.analytics?.filters?.excludedCountries || [],
          excludedTopPages: site.analytics?.filters?.excludedTopPages || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.listProperties = async (req, res, next) => {
  try {
    const effectiveUser = await resolveGoogleUser(req);
    const properties = await analyticsService.listProperties(effectiveUser);
    res.json({ success: true, data: properties });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    // Detect insufficient scope (403 from Google)
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'Analytics access not granted. Please reconnect your Google account.',
        },
      });
    }
    next(error);
  }
};

exports.linkProperty = async (req, res, next) => {
  try {
    const { propertyId, propertyName } = req.body;
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'propertyId is required' },
      });
    }

    await Site.findByIdAndUpdate(req.site._id, {
      'analytics.propertyId': propertyId,
      'analytics.propertyName': propertyName || null,
      'analytics.connectedAt': new Date(),
    });

    res.json({ success: true, data: { propertyId, message: 'Analytics property linked' } });
  } catch (error) {
    next(error);
  }
};

exports.unlinkProperty = async (req, res, next) => {
  try {
    await Site.findByIdAndUpdate(req.site._id, {
      'analytics.propertyId': null,
      'analytics.propertyName': null,
      'analytics.connectedAt': null,
    });

    res.json({ success: true, data: { message: 'Analytics property unlinked' } });
  } catch (error) {
    next(error);
  }
};

exports.getOverview = async (req, res, next) => {
  try {
    const site = req.site;
    const propertyId = site.analytics?.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Analytics property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const customStart = req.query.startDate;
    const customEnd = req.query.endDate;
    const { startDate, endDate } = (customStart && customEnd)
      ? { startDate: customStart, endDate: customEnd }
      : dateRange(period);

    const effectiveUser = await resolveGoogleUser(req);
    const [overview, trend] = await Promise.all([
      analyticsService.getOrganicOverview(effectiveUser, propertyId, { startDate, endDate }),
      analyticsService.getOrganicTrend(effectiveUser, propertyId, { startDate, endDate }),
    ]);

    res.json({
      success: true,
      data: {
        overview,
        trend,
        period,
        startDate,
        endDate,
        fetchedAt: overview.fetchedAt,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'Analytics access not granted. Please reconnect your Google account.',
        },
      });
    }
    next(error);
  }
};

exports.getWebsite = async (req, res, next) => {
  try {
    const site = req.site;
    const propertyId = site.analytics?.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Analytics property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const customStart = req.query.startDate;
    const customEnd = req.query.endDate;
    const { startDate, endDate } = (customStart && customEnd)
      ? { startDate: customStart, endDate: customEnd }
      : dateRange(period);

    const effectiveUser = await resolveGoogleUser(req);
    const filters = site.analytics?.filters || {};
    const excludedCountries = filters.excludedCountries || [];
    const excludedTopPages = filters.excludedTopPages || [];
    const [overview, details] = await Promise.all([
      analyticsService.getWebsiteOverview(effectiveUser, propertyId, { startDate, endDate }),
      analyticsService.getWebsiteDetails(effectiveUser, propertyId, { startDate, endDate, excludedCountries, excludedTopPages }),
    ]);

    res.json({
      success: true,
      data: { overview, details, period, startDate, endDate },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'Analytics access not granted. Please reconnect your Google account.',
        },
      });
    }
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const site = req.site;
    const propertyId = site.analytics?.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Analytics property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const customStart = req.query.startDate;
    const customEnd = req.query.endDate;
    const { startDate, endDate } = (customStart && customEnd)
      ? { startDate: customStart, endDate: customEnd }
      : dateRange(period);

    const effectiveUser = await resolveGoogleUser(req);
    const insights = await analyticsService.getOrganicInsights(effectiveUser, propertyId, {
      startDate,
      endDate,
      rowLimit: 10,
    });

    res.json({
      success: true,
      data: { ...insights, period, startDate, endDate },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'Analytics access not granted. Please reconnect your Google account.',
        },
      });
    }
    next(error);
  }
};

exports.updateFilters = async (req, res, next) => {
  try {
    const { excludedCountries, excludedTopPages } = req.body;
    const update = {};
    if (Array.isArray(excludedCountries)) update['analytics.filters.excludedCountries'] = excludedCountries;
    if (Array.isArray(excludedTopPages)) update['analytics.filters.excludedTopPages'] = excludedTopPages;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No filter fields provided' },
      });
    }

    await Site.findByIdAndUpdate(req.site._id, update);
    res.json({
      success: true,
      data: {
        excludedCountries: update['analytics.filters.excludedCountries'] ?? req.site.analytics?.filters?.excludedCountries ?? [],
        excludedTopPages: update['analytics.filters.excludedTopPages'] ?? req.site.analytics?.filters?.excludedTopPages ?? [],
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCountries = async (req, res, next) => {
  try {
    const site = req.site;
    const propertyId = site.analytics?.propertyId;
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Analytics property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const customStart = req.query.startDate;
    const customEnd = req.query.endDate;
    const { startDate, endDate } = (customStart && customEnd)
      ? { startDate: customStart, endDate: customEnd }
      : dateRange(period);

    const effectiveUser = await resolveGoogleUser(req);
    const countries = await analyticsService.getCountryList(effectiveUser, propertyId, { startDate, endDate });
    res.json({ success: true, data: countries });
  } catch (error) {
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_SCOPE', message: 'Analytics access not granted.' },
      });
    }
    next(error);
  }
};
