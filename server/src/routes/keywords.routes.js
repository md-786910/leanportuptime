const router = require('express').Router({ mergeParams: true });
const kw = require('../controllers/keywords.controller');
const adminOnly = require('../middleware/adminOnly');

router.get('/status', kw.getStatus);
router.post('/', adminOnly, kw.addKeyword);
router.post('/bulk', adminOnly, kw.addKeywordsBulk);
router.post('/refresh', adminOnly, kw.refresh);
router.patch('/:keyword', adminOnly, kw.manualOverrideKeyword);
router.delete('/:keyword', adminOnly, kw.removeKeyword);

module.exports = router;
