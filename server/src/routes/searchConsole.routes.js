const router = require('express').Router({ mergeParams: true });
const searchConsoleController = require('../controllers/searchConsole.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/status', searchConsoleController.getStatus);
router.get('/properties', searchConsoleController.listProperties);
router.post('/link', adminOnly, searchConsoleController.linkProperty);
router.post('/unlink', adminOnly, searchConsoleController.unlinkProperty);
router.get('/performance', searchConsoleController.getPerformance);
router.get('/insights', searchConsoleController.getInsights);

module.exports = router;
