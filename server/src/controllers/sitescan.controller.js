const Site = require('../models/Site');
const SiteScan = require('../models/SiteScan');
const { siteScanQueue } = require('../config/queue');

exports.getLatest = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

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
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

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
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const scans = await SiteScan.find({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: scans });
  } catch (error) {
    next(error);
  }
};
