const Site = require('../models/Site');
const Check = require('../models/Check');
const { uptimeQueue } = require('../config/queue');

function siteFilter(user) {
  if (user.role === 'admin' && !user.invitedBy) return { userId: user._id };
  if (user.role === 'admin' && user.invitedBy) return { userId: user.invitedBy };
  return { _id: { $in: user.sharedSites || [] } };
}

function canAccessSite(user, site) {
  if (user.role === 'admin' && !user.invitedBy) return site.userId.equals(user._id);
  if (user.role === 'admin' && user.invitedBy) return site.userId.equals(user.invitedBy);
  return (user.sharedSites || []).some((id) => id.equals(site._id));
}

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, tag } = req.query;
    const filter = siteFilter(req.user);
    if (status) filter.currentStatus = status;
    if (tag) filter.tags = tag;

    const [sites, total] = await Promise.all([
      Site.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean(),
      Site.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sites,
      meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const siteCount = await Site.countDocuments({ userId: req.user._id });
    if (siteCount >= req.user.maxSites) {
      return res.status(403).json({
        success: false,
        error: { code: 'LIMIT_REACHED', message: `Plan limit reached (${req.user.maxSites} sites)` },
      });
    }

    const site = await Site.create({ ...req.body, userId: req.user._id });

    // Trigger first check immediately
    await uptimeQueue.add(
      'uptime-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 100, removeOnFail: 50 }
    );

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site || !canAccessSite(req.user, site)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }
    res.json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const ownerFilter = { _id: req.params.id, userId: req.user.invitedBy || req.user._id };
    const site = await Site.findOneAndUpdate(
      ownerFilter,
      req.body,
      { new: true, runValidators: true }
    );
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }
    res.json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const site = await Site.findOneAndDelete({ _id: req.params.id, userId: req.user.invitedBy || req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    // Clean up related data
    await Check.deleteMany({ siteId: site._id });

    res.json({ success: true, data: { message: 'Site deleted' } });
  } catch (error) {
    next(error);
  }
};

exports.triggerCheck = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site || !canAccessSite(req.user, site)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    await uptimeQueue.add(
      'uptime-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 100, removeOnFail: 50 }
    );

    res.json({ success: true, data: { message: 'Check triggered' } });
  } catch (error) {
    next(error);
  }
};

exports.togglePause = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site || !canAccessSite(req.user, site)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    site.paused = !site.paused;
    await site.save();

    res.json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};
