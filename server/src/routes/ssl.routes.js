const router = require('express').Router({ mergeParams: true });
const sslController = require('../controllers/ssl.controller');

router.get('/', sslController.getCurrent);
router.post('/check', sslController.triggerCheck);
router.get('/history', sslController.getHistory);

module.exports = router;
