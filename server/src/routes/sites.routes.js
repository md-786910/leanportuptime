const router = require('express').Router();
const Joi = require('joi');
const sitesController = require('../controllers/sites.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const createSiteSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  interval: Joi.number().min(60000).max(86400000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notifications: Joi.object({
    email: Joi.boolean(),
    slack: Joi.boolean(),
    discord: Joi.boolean(),
    webhook: Joi.boolean(),
    slackUrl: Joi.string().uri().allow('').optional(),
    discordUrl: Joi.string().uri().allow('').optional(),
    webhookUrl: Joi.string().uri().allow('').optional(),
  }).optional(),
});

const updateSiteSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
  interval: Joi.number().min(60000).max(86400000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notifications: Joi.object({
    email: Joi.boolean(),
    slack: Joi.boolean(),
    discord: Joi.boolean(),
    webhook: Joi.boolean(),
    slackUrl: Joi.string().uri().allow('').optional(),
    discordUrl: Joi.string().uri().allow('').optional(),
    webhookUrl: Joi.string().uri().allow('').optional(),
  }).optional(),
}).min(1);

router.use(auth);

router.get('/', sitesController.list);
router.post('/', validate(createSiteSchema), sitesController.create);
router.get('/:id', sitesController.get);
router.patch('/:id', validate(updateSiteSchema), sitesController.update);
router.delete('/:id', sitesController.remove);
router.post('/:id/check', sitesController.triggerCheck);
router.post('/:id/pause', sitesController.togglePause);

module.exports = router;
