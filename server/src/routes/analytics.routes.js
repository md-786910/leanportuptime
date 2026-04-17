const router = require('express').Router({ mergeParams: true });
const analyticsController = require('../controllers/analytics.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/status', analyticsController.getStatus);
router.get('/properties', analyticsController.listProperties);
router.post('/link', adminOnly, analyticsController.linkProperty);
router.post('/unlink', adminOnly, analyticsController.unlinkProperty);
router.get('/overview', analyticsController.getOverview);
router.get('/insights', analyticsController.getInsights);
router.get('/website', analyticsController.getWebsite);

module.exports = router;
