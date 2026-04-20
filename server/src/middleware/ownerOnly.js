/**
 * Middleware that restricts access to the original workspace owner.
 * Invited admins (role='admin' with invitedBy set) share most admin powers
 * but cannot perform destructive workspace-level actions like disconnecting
 * the shared Google OAuth connection.
 *
 * Must be applied AFTER the `auth` middleware (which sets req.user).
 */
module.exports = function ownerOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  if (req.user.invitedBy) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the workspace owner can perform this action' },
    });
  }
  next();
};
