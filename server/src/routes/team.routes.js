const router = require('express').Router();
const Joi = require('joi');
const teamController = require('../controllers/team.controller');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const updateMemberSchema = Joi.object({
  role: Joi.string().valid('admin', 'viewer'),
  sharedSites: Joi.array().items(Joi.string().hex().length(24)),
}).min(1);

router.use(auth);
router.use(requireAdmin);

router.get('/', teamController.list);
router.patch('/:userId', validate(updateMemberSchema), teamController.update);
router.delete('/:userId', teamController.remove);

module.exports = router;
