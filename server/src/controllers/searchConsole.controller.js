const searchConsoleService = require('../services/searchConsole.service');
const Site = require('../models/Site');

/**
 * Compute date range from a period string.
 * GSC data has ~2 day delay, so "yesterday" is a safe endDate.
 */
function dateRange(period) {
  const end = new Date();
  end.setDate(end.getDate() - 1); // yesterday (GSC delay)

  const start = new Date(end);
  switch (period) {
    case '24h':
      // Single day — most recent available
      break;
    case '7d':
      start.setDate(start.getDate() - 6);
      break;
    case '2m':
      start.setDate(start.getDate() - 59);
      break;
    case 'daily':
      start.setDate(start.getDate() - 27); // 28 days of daily data
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
    const user = req.user;
    const googleConnected = !!(user.google && user.google.connectedAt);
    const linked = !!(site.searchConsole && site.searchConsole.property);

    res.json({
      success: true,
      data: {
        googleConnected,
        linked,
        property: site.searchConsole?.property || null,
        connectedAt: site.searchConsole?.connectedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.listProperties = async (req, res, next) => {
  try {
    const properties = await searchConsoleService.listProperties(req.user);
    res.json({ success: true, data: properties });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.linkProperty = async (req, res, next) => {
  try {
    const { property } = req.body;
    if (!property) {
      return res.status(400).json({
        success: false,
        error: { message: 'property is required' },
      });
    }

    await Site.findByIdAndUpdate(req.site._id, {
      'searchConsole.property': property,
      'searchConsole.connectedAt': new Date(),
    });

    res.json({ success: true, data: { property, message: 'Property linked' } });
  } catch (error) {
    next(error);
  }
};

exports.unlinkProperty = async (req, res, next) => {
  try {
    await Site.findByIdAndUpdate(req.site._id, {
      'searchConsole.property': null,
      'searchConsole.connectedAt': null,
    });

    res.json({ success: true, data: { message: 'Property unlinked' } });
  } catch (error) {
    next(error);
  }
};

exports.getPerformance = async (req, res, next) => {
  try {
    const site = req.site;
    const property = site.searchConsole?.property;

    if (!property) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Search Console property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const { startDate, endDate } = dateRange(period);

    // For 'daily' period, always include date dimension
    const dimensions = period === 'daily' ? ['date'] : [];

    const result = await searchConsoleService.getPerformance(req.user, property, {
      startDate,
      endDate,
      dimensions,
    });

    // Also fetch daily breakdown for non-daily periods (for the trend chart)
    let daily = result.daily;
    if (period !== 'daily' && period !== '24h') {
      const dailyResult = await searchConsoleService.getPerformance(req.user, property, {
        startDate,
        endDate,
        dimensions: ['date'],
      });
      daily = dailyResult.daily;
    }

    res.json({
      success: true,
      data: {
        totals: result.totals,
        daily,
        period,
        startDate,
        endDate,
        fetchedAt: result.fetchedAt,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const site = req.site;
    const property = site.searchConsole?.property;

    if (!property) {
      return res.status(400).json({
        success: false,
        error: { message: 'No Search Console property linked to this site' },
      });
    }

    const period = req.query.period || '28d';
    const { startDate, endDate } = dateRange(period);

    const insights = await searchConsoleService.getInsights(req.user, property, {
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
    next(error);
  }
};
