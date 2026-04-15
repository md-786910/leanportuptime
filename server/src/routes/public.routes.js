const router = require('express').Router();
const { publicLimiter } = require('../middleware/rateLimiter');
const shareAuth = require('../middleware/shareAuth');
const controller = require('../controllers/public.controller');

router.use(publicLimiter);

router.get('/:token', shareAuth, controller.getSharedSite);
router.get('/:token/checks', shareAuth, controller.getSharedChecks);
router.get('/:token/checks/summary', shareAuth, controller.getSharedCheckSummary);
router.get('/:token/ssl', shareAuth, controller.getSharedSSL);
router.get('/:token/security', shareAuth, controller.getSharedSecurity);
router.get('/:token/seo', shareAuth, controller.getSharedSeo);
router.get('/:token/plugins', shareAuth, controller.getSharedPlugins);
router.get('/:token/sitescan', shareAuth, controller.getSharedSiteScan);

module.exports = router;
