const ShareLink = require('../models/ShareLink');
const Site = require('../models/Site');

const shareAuth = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_SHARE_LINK', message: 'Share link not found or expired' },
      });
    }

    const shareLink = await ShareLink.findOne({ token, isActive: true });

    if (!shareLink) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_SHARE_LINK', message: 'Share link not found or expired' },
      });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: 'SHARE_LINK_EXPIRED', message: 'Share link not found or expired' },
      });
    }

    const site = await Site.findById(shareLink.siteId);

    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    // Fire-and-forget access tracking
    ShareLink.updateOne(
      { _id: shareLink._id },
      { $inc: { accessCount: 1 }, $set: { lastAccessedAt: new Date() } }
    ).exec();

    req.shareLink = shareLink;
    req.site = site;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = shareAuth;
