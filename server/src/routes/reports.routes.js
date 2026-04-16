const router = require('express').Router({ mergeParams: true });
const reportsController = require('../controllers/reports.controller');

router.get('/pdf', reportsController.generatePDF);
router.get('/seo/pdf', reportsController.generateSEOPDF);

module.exports = router;
