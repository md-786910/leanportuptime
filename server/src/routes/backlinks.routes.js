const router = require('express').Router({ mergeParams: true });
const backlinksController = require('../controllers/backlinks.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/status', backlinksController.getStatus);
router.post('/refresh', adminOnly, backlinksController.refresh);

module.exports = router;
