const router = require('express').Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .populate('siteId', 'name url')
        .lean(),
      Notification.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: notifications,
      meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
