const Site = require('../models/Site');
const ShareLink = require('../models/ShareLink');

exports.list = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const links = await ShareLink.find({ siteId: site._id, userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: links });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const { label, visibleSections, expiresAt } = req.body;

    const shareLink = await ShareLink.create({
      siteId: site._id,
      userId: req.user._id,
      token: ShareLink.generateToken(),
      label: label || '',
      visibleSections: visibleSections || {},
      expiresAt: expiresAt || null,
    });

    res.status(201).json({ success: true, data: shareLink });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const { label, visibleSections, expiresAt } = req.body;
    const update = {};
    if (label !== undefined) update.label = label;
    if (visibleSections !== undefined) update.visibleSections = visibleSections;
    if (expiresAt !== undefined) update.expiresAt = expiresAt;

    const shareLink = await ShareLink.findOneAndUpdate(
      { _id: req.params.linkId, siteId: site._id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Share link not found' },
      });
    }

    res.json({ success: true, data: shareLink });
  } catch (error) {
    next(error);
  }
};

exports.revoke = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const shareLink = await ShareLink.findOneAndDelete({
      _id: req.params.linkId,
      siteId: site._id,
      userId: req.user._id,
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Share link not found' },
      });
    }

    res.json({ success: true, data: { message: 'Share link revoked' } });
  } catch (error) {
    next(error);
  }
};

exports.regenerate = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const shareLink = await ShareLink.findOneAndUpdate(
      { _id: req.params.linkId, siteId: site._id, userId: req.user._id },
      { token: ShareLink.generateToken() },
      { new: true }
    );

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Share link not found' },
      });
    }

    res.json({ success: true, data: shareLink });
  } catch (error) {
    next(error);
  }
};
