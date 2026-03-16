const router = require('express').Router({ mergeParams: true });
const siteScanController = require('../controllers/sitescan.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', siteScanController.getLatest);
router.post('/scan', siteScanController.triggerScan);
router.get('/history', siteScanController.getHistory);

module.exports = router;
