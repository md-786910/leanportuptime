const config = require('../config');
const searchConsoleService = require('../services/searchConsole.service');
const resolveGoogleUser = require('../utils/resolveGoogleUser');

// Invited admins share the workspace owner's Google connection. Writes must
// always target the owner's User record so every admin sees the same tokens.
function ownerIdOf(user) {
  return user.invitedBy || user._id;
}

exports.connect = async (req, res, next) => {
  try {
    if (!config.google.clientId || !config.google.clientSecret) {
      return res.status(400).json({
        success: false,
        error: { message: 'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      });
    }

    const authUrl = searchConsoleService.getAuthUrl(ownerIdOf(req.user));
    res.json({ success: true, data: { authUrl } });
  } catch (error) {
    next(error);
  }
};

exports.callback = async (req, res, next) => {
  try {
    const { code, state: userId, error: authError } = req.query;

    const redirectBase = config.clientUrl || 'http://localhost:3000';

    if (authError) {
      return res.redirect(`${redirectBase}?google_auth=error&reason=${encodeURIComponent(authError)}`);
    }

    if (!code || !userId) {
      return res.redirect(`${redirectBase}?google_auth=error&reason=missing_params`);
    }

    await searchConsoleService.handleCallback(code, userId);
    res.redirect(`${redirectBase}?google_auth=success`);
  } catch (error) {
    const redirectBase = config.clientUrl || 'http://localhost:3000';
    res.redirect(`${redirectBase}?google_auth=error&reason=${encodeURIComponent(error.message)}`);
  }
};

exports.disconnect = async (req, res, next) => {
  try {
    await searchConsoleService.disconnect(ownerIdOf(req.user));
    res.json({ success: true, data: { message: 'Google account disconnected' } });
  } catch (error) {
    next(error);
  }
};

exports.status = async (req, res, next) => {
  try {
    // For viewers, report the site-owner (inviter)'s Google connection status
    // so the UI correctly reflects whether Google data is available for them to view.
    const effectiveUser = await resolveGoogleUser(req);
    const user = effectiveUser || req.user;
    const connected = !!(user.google && user.google.connectedAt);
    res.json({
      success: true,
      data: {
        connected,
        email: user.google?.email || null,
        connectedAt: user.google?.connectedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
