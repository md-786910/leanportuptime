const router = require('express').Router({ mergeParams: true });
const seoController = require('../controllers/seo.controller');

router.get('/', seoController.getLatest);
router.post('/scan', seoController.triggerScan);
router.get('/history', seoController.getHistory);
router.post('/pagespeed', seoController.fetchPageSpeed);

module.exports = router;
