const Site = require('../models/Site');
const SecurityAudit = require('../models/SecurityAudit');
const { securityQueue } = require('../config/queue');

exports.getLatest = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const audit = await SecurityAudit.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: audit });
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

    await securityQueue.add(
      'security-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 50, removeOnFail: 20 }
    );

    res.json({ success: true, data: { message: 'Security scan triggered' } });
  } catch (error) {
    next(error);
  }
};
