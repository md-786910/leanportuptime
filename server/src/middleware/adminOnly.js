/**
 * Middleware that restricts access to admin users only.
 * Must be applied AFTER the `auth` middleware (which sets req.user).
 * Returns 403 Forbidden for viewers or unauthenticated requests.
 */
module.exports = function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'This action requires admin privileges' },
    });
  }
  next();
};
