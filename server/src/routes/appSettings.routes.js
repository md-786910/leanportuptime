const router = require('express').Router();
const appSettingsController = require('../controllers/appSettings.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/', appSettingsController.getSettings);
router.patch('/', adminOnly, appSettingsController.updateSettings);

module.exports = router;
