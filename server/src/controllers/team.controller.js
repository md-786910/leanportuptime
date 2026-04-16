const User = require('../models/User');
const Site = require('../models/Site');

exports.list = async (req, res, next) => {
  try {
    const members = await User.find({ invitedBy: req.user._id })
      .populate('sharedSites', 'name url')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const member = await User.findOne({
      _id: req.params.userId,
      invitedBy: req.user._id,
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Team member not found' },
      });
    }

    const { role, sharedSites } = req.body;
    if (role) member.role = role;
    if (sharedSites) {
      // Validate sites belong to admin
      const siteCount = await Site.countDocuments({
        _id: { $in: sharedSites },
        userId: req.user._id,
      });
      if (siteCount !== sharedSites.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SITES', message: 'One or more sites not found' },
        });
      }
      member.sharedSites = sharedSites;
    }
    await member.save();

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const member = await User.findOneAndDelete({
      _id: req.params.userId,
      invitedBy: req.user._id,
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Team member not found' },
      });
    }

    res.json({ success: true, data: { message: 'Team member removed' } });
  } catch (error) {
    next(error);
  }
};
