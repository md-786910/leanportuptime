const Check = require('../models/Check');
const SSLCert = require('../models/SSLCert');
const SecurityAudit = require('../models/SecurityAudit');
const SeoAudit = require('../models/SeoAudit');
const PluginAudit = require('../models/PluginAudit');
const SiteScan = require('../models/SiteScan');

const sectionGuard = (section, res) => {
  return res.status(403).json({
    success: false,
    error: { code: 'SECTION_HIDDEN', message: `The ${section} section is not available on this share link` },
  });
};

exports.getSharedSite = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    const publicSite = {
      name: site.name,
      url: site.url,
      currentStatus: site.currentStatus,
      lastCheckedAt: site.lastCheckedAt,
      createdAt: site.createdAt,
      ssl: shareLink.visibleSections.ssl ? site.ssl : undefined,
      securityScore: shareLink.visibleSections.security ? site.securityScore : undefined,
      seo: shareLink.visibleSections.seo ? site.seo : undefined,
      plugins: shareLink.visibleSections.plugins ? site.plugins : undefined,
      siteScan: shareLink.visibleSections.sitescan ? site.siteScan : undefined,
    };

    res.json({
      success: true,
      data: {
        site: publicSite,
        visibleSections: shareLink.visibleSections,
        label: shareLink.label,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSharedChecks = async (req, res, next) => {
  try {
    const { site, shareLink } = req;
    const { overview, performance, history } = shareLink.visibleSections;

    if (!overview && !performance && !history) {
      return sectionGuard('checks', res);
    }

    const { cursor, limit = 50 } = req.query;
    const filter = { siteId: site._id };
    if (cursor) filter._id = { $lt: cursor };

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

exports.getSharedCheckSummary = async (req, res, next) => {
  try {
    const { site, shareLink } = req;
    const { overview, performance, history } = shareLink.visibleSections;

    if (!overview && !performance && !history) {
      return sectionGuard('check summary', res);
    }

    const { period = '24h' } = req.query;
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
      totalChecks: 0, upChecks: 0, downChecks: 0, degradedChecks: 0,
      avgResponseTime: 0, avgTtfb: 0, maxResponseTime: 0, minResponseTime: 0,
    };

    data.uptimePercent = data.totalChecks > 0
      ? (((data.upChecks + data.degradedChecks) / data.totalChecks) * 100).toFixed(2)
      : '0.00';

    res.json({ success: true, data, meta: { period, since } });
  } catch (error) {
    next(error);
  }
};

exports.getSharedSSL = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    if (!shareLink.visibleSections.ssl) {
      return sectionGuard('ssl', res);
    }

    const sslData = site.ssl || {};
    const history = await SSLCert.find({ siteId: site._id })
      .sort({ checkedAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: { current: sslData, history } });
  } catch (error) {
    next(error);
  }
};

exports.getSharedSecurity = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    if (!shareLink.visibleSections.security) {
      return sectionGuard('security', res);
    }

    const audit = await SecurityAudit.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

exports.getSharedSeo = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    if (!shareLink.visibleSections.seo) {
      return sectionGuard('seo', res);
    }

    const audit = await SeoAudit.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

exports.getSharedPlugins = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    if (!shareLink.visibleSections.plugins) {
      return sectionGuard('plugins', res);
    }

    const audit = await PluginAudit.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

exports.getSharedSiteScan = async (req, res, next) => {
  try {
    const { site, shareLink } = req;

    if (!shareLink.visibleSections.sitescan) {
      return sectionGuard('sitescan', res);
    }

    const scan = await SiteScan.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: scan });
  } catch (error) {
    next(error);
  }
};
