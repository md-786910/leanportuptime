const router = require('express').Router({ mergeParams: true });
const reportsController = require('../controllers/reports.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/pdf', reportsController.generatePDF);
router.get('/seo/pdf', reportsController.generateSEOPDF);

module.exports = router;
