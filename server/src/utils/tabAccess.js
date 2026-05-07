const { SITE_TABS_SET } = require('../constants/tabs');

function getAllowedTabsForUser(user, siteId) {
  if (!user) return [];
  if (user.role === 'admin') return null; // null = all tabs
  const map = user.sharedSiteTabs;
  if (!map) return null;
  const key = String(siteId);
  const entry = typeof map.get === 'function' ? map.get(key) : map[key];
  if (!entry || !entry.length) return null; // backward-compat: no entry => all tabs
  return entry;
}

function canAccessTab(user, siteId, tab) {
  if (!SITE_TABS_SET.has(tab)) return false;
  const allowed = getAllowedTabsForUser(user, siteId);
  if (allowed === null) return true;
  return allowed.includes(tab);
}

function requireTab(tab) {
  return (req, res, next) => {
    const siteId = req.params.id || req.params.siteId;
    if (!canAccessTab(req.user, siteId, tab)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_TAB', message: `Access to "${tab}" tab is not granted` },
      });
    }
    next();
  };
}

// Pass if the user can reach the site through ANY of the listed tabs.
// Use for endpoints whose data is consumed by more than one tab (e.g.
// /api/sites/:id/checks feeds both Performance and History).
function requireAnyTab(tabs) {
  return (req, res, next) => {
    const siteId = req.params.id || req.params.siteId;
    if (tabs.some((t) => canAccessTab(req.user, siteId, t))) return next();
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_TAB', message: `Access to "${tabs.join('/')}" tabs is not granted` },
    });
  };
}

module.exports = { canAccessTab, getAllowedTabsForUser, requireTab, requireAnyTab };
