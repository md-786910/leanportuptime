const router = require('express').Router();
const backupsController = require('../controllers/backups.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/', adminOnly, backupsController.list);
router.post('/', adminOnly, backupsController.create);

module.exports = router;
