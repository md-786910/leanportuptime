const router = require('express').Router({ mergeParams: true });
const pluginController = require('../controllers/plugin.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', pluginController.getLatest);
router.post('/scan', pluginController.triggerScan);
router.get('/history', pluginController.getHistory);

module.exports = router;
