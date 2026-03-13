const router = require('express').Router({ mergeParams: true });
const reportsController = require('../controllers/reports.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/pdf', reportsController.generatePDF);

module.exports = router;
