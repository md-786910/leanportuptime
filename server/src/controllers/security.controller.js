const SecurityAudit = require('../models/SecurityAudit');
const { securityQueue } = require('../config/queue');

exports.getLatest = async (req, res, next) => {
  try {
    const site = req.site;
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
    const site = req.site;
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
