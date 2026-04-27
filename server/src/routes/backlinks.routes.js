const router = require('express').Router({ mergeParams: true });
const backlinksController = require('../controllers/backlinks.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/status', backlinksController.getStatus);
router.post('/refresh', adminOnly, backlinksController.refresh);

// Admin-only manual override of aggregate stats + changelog readout.
router.patch('/manual', adminOnly, backlinksController.manualOverride);
router.get('/changelog', backlinksController.getChangelog);

// Admin-only CRUD on individual backlink items.
router.post('/items', adminOnly, backlinksController.addItem);
router.patch('/items/:itemId', adminOnly, backlinksController.updateItem);
router.delete('/items/:itemId', adminOnly, backlinksController.removeItem);

module.exports = router;
