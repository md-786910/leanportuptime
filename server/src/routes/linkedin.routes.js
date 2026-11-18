const router = require('express').Router({ mergeParams: true });
const linkedinController = require('../controllers/linkedin.controller');

router.get('/metrics', linkedinController.getMetrics);

module.exports = router;
