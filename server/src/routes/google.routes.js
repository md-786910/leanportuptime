const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const googleController = require('../controllers/google.controller');

router.get('/connect', auth, adminOnly, googleController.connect);
router.get('/callback', googleController.callback); // No auth — Google redirects here
router.post('/disconnect', auth, adminOnly, googleController.disconnect);
router.get('/status', auth, googleController.status);

module.exports = router;
