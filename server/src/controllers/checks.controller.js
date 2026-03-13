const Check = require('../models/Check');
const Site = require('../models/Site');

exports.getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cursor, limit = 50, from, to } = req.query;

    // Verify site ownership
    const site = await Site.findOne({ _id: id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const filter = { siteId: id };
    if (cursor) filter._id = { $lt: cursor };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const checks = await Check.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10) + 1)
      .lean();

    const hasMore = checks.length > parseInt(limit, 10);
    if (hasMore) checks.pop();

    const nextCursor = hasMore ? checks[checks.length - 1]._id : null;

    res.json({
      success: true,
      data: checks,
      meta: { limit: parseInt(limit, 10), hasMore, nextCursor },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const site = await Site.findOne({ _id: id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const periodMap = { '24h': 1, '7d': 7, '30d': 30 };
    const days = periodMap[period] || 1;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary] = await Check.aggregate([
      { $match: { siteId: site._id, timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          totalChecks: { $sum: 1 },
          upChecks: { $sum: { $cond: [{ $eq: ['$status', 'up'] }, 1, 0] } },
          downChecks: { $sum: { $cond: [{ $eq: ['$status', 'down'] }, 1, 0] } },
          degradedChecks: { $sum: { $cond: [{ $eq: ['$status', 'degraded'] }, 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' },
          avgTtfb: { $avg: '$ttfb' },
          maxResponseTime: { $max: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
        },
      },
    ]);

    const data = summary || {
      totalChecks: 0,
      upChecks: 0,
      downChecks: 0,
      degradedChecks: 0,
      avgResponseTime: 0,
      avgTtfb: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
    };

    data.uptimePercent = data.totalChecks > 0
      ? (((data.upChecks + data.degradedChecks) / data.totalChecks) * 100).toFixed(2)
      : '0.00';

    res.json({ success: true, data, meta: { period, since } });
  } catch (error) {
    next(error);
  }
};
