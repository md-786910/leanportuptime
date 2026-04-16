const Site = require('../models/Site');

/**
 * Middleware that loads the site and checks if the current user can access it.
 * Attaches req.site on success. Returns 404 if not found or not authorized.
 *
 * Works for routes with :id param (e.g. /api/sites/:id/ssl).
 */
const siteAccess = async (req, res, next) => {
  try {
    const siteId = req.params.id;
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const user = req.user;
    let allowed = false;

    if (user.role === 'admin' && !user.invitedBy) {
      // Original owner
      allowed = site.userId.equals(user._id);
    } else if (user.role === 'admin' && user.invitedBy) {
      // Invited admin — sees all of inviter's sites
      allowed = site.userId.equals(user.invitedBy);
    } else {
      // Viewer — only shared sites
      allowed = (user.sharedSites || []).some((id) => id.equals(site._id));
    }

    if (!allowed) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    req.site = site;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = siteAccess;
