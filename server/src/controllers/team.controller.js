const User = require('../models/User');
const Site = require('../models/Site');

// Resolve the workspace owner id. Invited admins are transparent co-admins
// of the original owner's workspace, so every team-scoped query uses this.
function ownerIdOf(user) {
  return user.invitedBy || user._id;
}

exports.list = async (req, res, next) => {
  try {
    // Single-tenant instance: list every registered user on the platform,
    // minus the caller (the frontend prepends them as "You" already).
    const members = await User.find({ _id: { $ne: req.user._id } })
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
    if (req.params.userId === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_EDIT_FORBIDDEN', message: 'You cannot edit your own team entry' },
      });
    }
    const ownerId = ownerIdOf(req.user);
    const member = await User.findOne({
      _id: req.params.userId,
      invitedBy: ownerId,
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
      const siteCount = await Site.countDocuments({
        _id: { $in: sharedSites },
        userId: ownerId,
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
    if (req.params.userId === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_REMOVE_FORBIDDEN', message: 'You cannot remove yourself from the team' },
      });
    }
    const ownerId = ownerIdOf(req.user);
    const member = await User.findOneAndDelete({
      _id: req.params.userId,
      invitedBy: ownerId,
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
