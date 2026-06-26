// PUBLIC webhook router — WordPress posts form submissions here. Secured by a
// shared secret header (checked in the controller), NOT by JWT auth.
const router = require('express').Router();
const formSubmissionsController = require('../controllers/formSubmissions.controller');
const { formWebhookLimiter } = require('../middleware/rateLimiter');

router.post('/webhook', formWebhookLimiter, formSubmissionsController.createFromWebhook);

module.exports = router;
