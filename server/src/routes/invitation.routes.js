const router = require('express').Router();
const Joi = require('joi');
const invitationController = require('../controllers/invitation.controller');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const createInvitationsSchema = Joi.object({
  invitations: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        role: Joi.string().valid('admin', 'viewer').default('viewer'),
        siteIds: Joi.array().items(Joi.string().hex().length(24)).default([]),
      })
    )
    .min(1)
    .required(),
});

const updateInvitationSchema = Joi.object({
  role: Joi.string().valid('admin', 'viewer'),
  siteIds: Joi.array().items(Joi.string().hex().length(24)),
}).min(1);

const acceptInvitationSchema = Joi.object({
  token: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).required(),
});

// Public routes — no auth
router.get('/status/:token', invitationController.getStatus);
router.post('/accept', validate(acceptInvitationSchema), invitationController.accept);

// Protected admin routes
router.use(auth);
router.use(requireAdmin);

router.post('/', validate(createInvitationsSchema), invitationController.create);
router.get('/', invitationController.list);
router.patch('/:id', validate(updateInvitationSchema), invitationController.update);
router.delete('/:id', invitationController.remove);
router.post('/:id/resend', invitationController.resend);

module.exports = router;
