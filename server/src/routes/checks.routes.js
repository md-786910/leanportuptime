const router = require('express').Router({ mergeParams: true });
const checksController = require('../controllers/checks.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', checksController.getHistory);
router.get('/summary', checksController.getSummary);

module.exports = router;
