const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ownerOnly = require('../middleware/ownerOnly');
const googleController = require('../controllers/google.controller');

// Connect + Disconnect are workspace-owner actions — invited admins delegate
// to the owner's Google connection and cannot create or sever it.
router.get('/connect', auth, adminOnly, ownerOnly, googleController.connect);
router.get('/callback', googleController.callback); // No auth — Google redirects here
router.post('/disconnect', auth, adminOnly, ownerOnly, googleController.disconnect);
router.get('/status', auth, googleController.status);

module.exports = router;
