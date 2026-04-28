const SiteScan = require('../models/SiteScan');
const Site = require('../models/Site');
const { siteScanQueue } = require('../config/queue');

exports.getLatest = async (req, res, next) => {
  try {
    const site = req.site;
    const scan = await SiteScan.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();
    res.json({ success: true, data: scan });
  } catch (error) {
    next(error);
  }
};

exports.triggerScan = async (req, res, next) => {
  try {
    const site = req.site;
    await siteScanQueue.add(
      'sitescan-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 50, removeOnFail: 20 }
    );
    res.json({ success: true, data: { message: 'Full site scan triggered' } });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const site = req.site;
    const scans = await SiteScan.find({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: scans });
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance trend history for dashboard
 * Aggregates historical performance data for all user sites
 */
exports.getDashboardTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);
    
    // Get all sites for this user
    const siteFilter = req.user.invitedBy 
      ? { userId: req.user.invitedBy }
      : { userId: req.user._id };
    
    const sites = await Site.find(siteFilter).select('_id name').lean();
    const siteIds = sites.map(s => s._id);
    
    if (!siteIds.length) {
      return res.json({ 
        success: true, 
        data: { trends: [], sites: [] } 
      });
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Fetch all scans in the date range
    const scans = await SiteScan.find({
      siteId: { $in: siteIds },
      scannedAt: { $gte: startDate },
    })
      .sort({ scannedAt: 1 })
      .lean();

    // Group by site and organize by date
    const trendsMap = new Map();
    
    for (const scan of scans) {
      const siteId = scan.siteId.toString();
      if (!trendsMap.has(siteId)) {
        const site = sites.find(s => s._id.toString() === siteId);
        trendsMap.set(siteId, {
          site: { id: siteId, name: site?.name || 'Unknown' },
          history: [],
        });
      }
      
      const trendData = trendsMap.get(siteId);
      trendData.history.push({
        timestamp: scan.scannedAt,
        performanceScore: scan.performanceScore || 0,
        bugsScore: scan.bugsScore || 0,
        malwareScore: scan.malwareScore || 0,
        score: scan.score || 0,
        responseTime: scan.responseTime || 0,
        pageSize: scan.pageSize || 0,
      });
    }

    // Convert to array and sort by site name
    const trends = Array.from(trendsMap.values())
      .sort((a, b) => a.site.name.localeCompare(b.site.name));

    res.json({
      success: true,
      data: {
        trends,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days: daysNum,
        },
        totalSites: sites.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
