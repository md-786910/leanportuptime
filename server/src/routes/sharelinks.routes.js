const router = require('express').Router({ mergeParams: true });
const auth = require('../middleware/auth');
const controller = require('../controllers/sharelinks.controller');

router.use(auth);

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:linkId', controller.update);
router.delete('/:linkId', controller.revoke);
router.post('/:linkId/regenerate', controller.regenerate);

module.exports = router;
