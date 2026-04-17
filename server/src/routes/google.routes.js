const router = require('express').Router();
const auth = require('../middleware/auth');
const googleController = require('../controllers/google.controller');

router.get('/connect', auth, googleController.connect);
router.get('/callback', googleController.callback); // No auth — Google redirects here
router.post('/disconnect', auth, googleController.disconnect);
router.get('/status', auth, googleController.status);

module.exports = router;
