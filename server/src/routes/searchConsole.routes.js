const router = require('express').Router({ mergeParams: true });
const searchConsoleController = require('../controllers/searchConsole.controller');

router.get('/status', searchConsoleController.getStatus);
router.get('/properties', searchConsoleController.listProperties);
router.post('/link', searchConsoleController.linkProperty);
router.post('/unlink', searchConsoleController.unlinkProperty);
router.get('/performance', searchConsoleController.getPerformance);
router.get('/insights', searchConsoleController.getInsights);

module.exports = router;
