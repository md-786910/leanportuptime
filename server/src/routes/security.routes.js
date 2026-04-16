const router = require('express').Router({ mergeParams: true });
const securityController = require('../controllers/security.controller');

router.get('/', securityController.getLatest);
router.post('/scan', securityController.triggerScan);

module.exports = router;
