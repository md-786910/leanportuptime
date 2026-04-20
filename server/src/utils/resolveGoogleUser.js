const User = require('../models/User');

/**
 * Resolve which user's Google credentials should be used for a request.
 *
 * - Original admins (invitedBy === null) use their own Google account.
 * - Delegates (viewers AND invited admins — anyone with invitedBy set) defer
 *   to the site owner's Google tokens, then fall back to the inviter's.
 *   Delegates cannot hold their own Google connection.
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

  // Original owner: use their own account.
  if (!callingUser.invitedBy) {
    return callingUser;
  }

  // Delegate (viewer or invited admin) with a specific site in context: use site owner.
  if (req.site && req.site.userId) {
    const owner = await User.findById(req.site.userId);
    if (owner) return owner;
  }

  // Delegate without site context: fall back to inviter.
  const inviter = await User.findById(callingUser.invitedBy);
  if (inviter) return inviter;

  // Last resort — return the delegate themselves (their google will be empty,
  // which the services already handle gracefully).
  return callingUser;
}

module.exports = resolveGoogleUser;
