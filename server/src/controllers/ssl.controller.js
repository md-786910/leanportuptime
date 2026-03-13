const Site = require('../models/Site');
const SSLCert = require('../models/SSLCert');
const sslService = require('../services/ssl.service');
const { sslQueue } = require('../config/queue');

exports.getCurrent = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const sslData = site.ssl || {};
    res.json({ success: true, data: sslData });
  } catch (error) {
    next(error);
  }
};

exports.triggerCheck = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

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
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const history = await SSLCert.find({ siteId: site._id })
      .sort({ checkedAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
