const SSLCert = require('../models/SSLCert');
const { sslQueue } = require('../config/queue');

exports.getCurrent = async (req, res, next) => {
  try {
    const site = req.site;
    const sslData = site.ssl || {};
    res.json({ success: true, data: sslData });
  } catch (error) {
    next(error);
  }
};

exports.triggerCheck = async (req, res, next) => {
  try {
    const site = req.site;
    await sslQueue.add(
      'ssl-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 50, removeOnFail: 20 }
    );
    res.json({ success: true, data: { message: 'SSL check queued' } });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const site = req.site;
    const history = await SSLCert.find({ siteId: site._id })
      .sort({ checkedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
