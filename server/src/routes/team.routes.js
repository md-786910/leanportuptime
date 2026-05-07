const router = require('express').Router();
const Joi = require('joi');
const teamController = require('../controllers/team.controller');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { SITE_TABS } = require('../constants/tabs');

const siteTabsSchema = Joi.object()
  .pattern(
    Joi.string().hex().length(24),
    Joi.array().items(Joi.string().valid(...SITE_TABS)).default([])
  )
  .default({});

const updateMemberSchema = Joi.object({
  role: Joi.string().valid('admin', 'viewer'),
  sharedSites: Joi.array().items(Joi.string().hex().length(24)),
  siteTabs: siteTabsSchema,
}).min(1);

router.use(auth);
router.use(requireAdmin);

router.get('/', teamController.list);
router.patch('/:userId', validate(updateMemberSchema), teamController.update);
router.delete('/:userId', teamController.remove);

module.exports = router;
