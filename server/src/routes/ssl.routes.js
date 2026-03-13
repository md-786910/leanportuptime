const router = require('express').Router({ mergeParams: true });
const sslController = require('../controllers/ssl.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', sslController.getCurrent);
router.post('/check', sslController.triggerCheck);
router.get('/history', sslController.getHistory);

module.exports = router;
