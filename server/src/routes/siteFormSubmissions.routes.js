// AUTHED router (mounted under /api/sites/:id/form-submissions). Lists and counts
// stored WordPress form submissions for a site.
const router = require('express').Router({ mergeParams: true });
const formSubmissionsController = require('../controllers/formSubmissions.controller');

router.get('/', formSubmissionsController.list);
router.get('/count', formSubmissionsController.count);

module.exports = router;
