const User = require('../models/User');

/**
 * Resolve which user's Google credentials should be used for a request.
 *
 * - Admin users use their own Google account.
 * - Viewer users use the Google account of the admin who owns the site they're viewing
 *   (req.site.userId) — viewers cannot connect their own Google.
 *
 * If `req.site` is available (route has `siteAccess` middleware), that takes precedence.
 * Otherwise falls back to `req.user.invitedBy` for non-site-specific routes.
 *
 * Returns a Mongoose User document (with populated google tokens) or the request user
 * itself as a sensible fallback.
 */
async function resolveGoogleUser(req) {
  const callingUser = req.user;
  if (!callingUser) return null;

  // Admin: use their own account
  if (callingUser.role !== 'viewer') {
    return callingUser;
  }

  // Viewer with a specific site in context: use site owner
  if (req.site && req.site.userId) {
    const owner = await User.findById(req.site.userId);
    if (owner) return owner;
  }

  // Viewer without site context: fall back to inviter
  if (callingUser.invitedBy) {
    const inviter = await User.findById(callingUser.invitedBy);
    if (inviter) return inviter;
  }

  // Last resort — return the viewer themselves (their google will be empty,
  // which the services already handle gracefully)
  return callingUser;
}

module.exports = resolveGoogleUser;
