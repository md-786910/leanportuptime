const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Site = require('../models/Site');
const config = require('../config');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const { SITE_TABS_SET } = require('../constants/tabs');

// Drop tab maps for sites the invite no longer covers, and filter out
// any unknown tab keys. The store treats an empty/missing entry as
// "all tabs", so we don't need to expand the full tab list here.
function sanitizeSiteTabs(siteTabs = {}, siteIds = []) {
  const allowed = new Set(siteIds.map(String));
  const out = {};
  for (const [siteId, tabs] of Object.entries(siteTabs || {})) {
    if (!allowed.has(siteId)) continue;
    if (!Array.isArray(tabs) || !tabs.length) continue;
    const filtered = tabs.filter((t) => SITE_TABS_SET.has(t));
    if (filtered.length) out[siteId] = filtered;
  }
  return out;
}

// Invited admins are transparent co-admins of the original owner. Team, invites
// and workspace-scoped lookups use this helper so everything ties back to the
// top-level owner regardless of which admin is calling.
function ownerIdOf(user) {
  return user.invitedBy || user._id;
}

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

exports.create = async (req, res, next) => {
  try {
    const { invitations } = req.body;
    const adminId = ownerIdOf(req.user);
    const isInvitedAdmin = !!req.user.invitedBy;
    const results = [];

    for (const inv of invitations) {
      const { email, role = 'viewer', siteIds = [], siteTabs = {} } = inv;

      // Only the original owner may mint new admins. Invited admins can
      // invite viewers only to prevent cascading admin sprawl.
      if (isInvitedAdmin && role === 'admin') {
        results.push({ email, error: 'Only the workspace owner can invite admins' });
        continue;
      }

      // Validate sites belong to admin
      if (siteIds.length > 0) {
        const siteCount = await Site.countDocuments({
          _id: { $in: siteIds },
          userId: adminId,
        });
        if (siteCount !== siteIds.length) {
          results.push({ email, error: 'One or more sites not found or not owned by you' });
          continue;
        }
      }

      // Check if already invited and pending
      const existingInvitation = await Invitation.findOne({
        email,
        invitedBy: adminId,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      });
      if (existingInvitation) {
        results.push({ email, error: 'Pending invitation already exists for this email' });
        continue;
      }

      // Check if user already exists and is on this admin's team
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.invitedBy?.equals(adminId)) {
        results.push({ email, error: 'User already on your team' });
        continue;
      }
      if (existingUser && existingUser.role === 'admin' && !existingUser.invitedBy) {
        results.push({ email, error: 'Email belongs to an existing admin account' });
        continue;
      }

      const sanitizedSiteTabs = sanitizeSiteTabs(siteTabs, siteIds);

      const token = crypto.randomBytes(32).toString('hex');
      const invitation = await Invitation.create({
        email,
        invitedBy: adminId,
        role,
        sharedSites: siteIds,
        sharedSiteTabs: sanitizedSiteTabs,
        token,
        expiresAt: new Date(Date.now() + config.invitationExpiryMinutes * 60 * 1000),
      });

      // Send invitation email
      const siteNames = [];
      if (siteIds.length > 0) {
        const sites = await Site.find({ _id: { $in: siteIds } }).select('name').lean();
        siteNames.push(...sites.map((s) => s.name));
      }
      const acceptUrl = `${config.clientUrl}/accept-invitation/${token}`;
      try {
        await notificationService.sendInvitationEmail(email, req.user.name, siteNames, acceptUrl);
      } catch (emailErr) {
        logger.error(`Failed to send invitation email to ${email}: ${emailErr.message}`);
      }

      results.push({ email, invitation });
    }

    res.status(201).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { invitedBy: ownerIdOf(req.user) };
    if (status) filter.status = status;

    const invitations = await Invitation.find(filter)
      .populate('sharedSites', 'name url')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const ownerId = ownerIdOf(req.user);
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      invitedBy: ownerId,
      status: 'pending',
    });
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pending invitation not found' },
      });
    }

    const { role, siteIds, siteTabs } = req.body;
    if (role) invitation.role = role;
    if (siteIds) {
      const siteCount = await Site.countDocuments({
        _id: { $in: siteIds },
        userId: ownerId,
      });
      if (siteCount !== siteIds.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SITES', message: 'One or more sites not found' },
        });
      }
      invitation.sharedSites = siteIds;
    }
    if (siteTabs !== undefined) {
      const effectiveSiteIds = (siteIds || invitation.sharedSites || []).map((id) => id.toString());
      invitation.sharedSiteTabs = sanitizeSiteTabs(siteTabs, effectiveSiteIds);
    }
    await invitation.save();

    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOneAndUpdate(
      { _id: req.params.id, invitedBy: ownerIdOf(req.user), status: 'pending' },
      { status: 'revoked' },
      { new: true }
    );
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pending invitation not found' },
      });
    }

    res.json({ success: true, data: { message: 'Invitation revoked' } });
  } catch (error) {
    next(error);
  }
};

exports.resend = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      invitedBy: ownerIdOf(req.user),
    });
    if (!invitation || invitation.status === 'accepted') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found or already accepted' },
      });
    }

    // Reset token and expiry
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + config.invitationExpiryMinutes * 60 * 1000);
    invitation.status = 'pending';
    await invitation.save();

    const sites = await Site.find({ _id: { $in: invitation.sharedSites } }).select('name').lean();
    const acceptUrl = `${config.clientUrl}/accept-invitation/${invitation.token}`;
    try {
      await notificationService.sendInvitationEmail(
        invitation.email,
        req.user.name,
        sites.map((s) => s.name),
        acceptUrl
      );
    } catch (emailErr) {
      logger.error(`Failed to resend invitation to ${invitation.email}: ${emailErr.message}`);
    }

    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      });
    }

    let status = invitation.status;
    if (status === 'pending' && invitation.expiresAt < new Date()) {
      status = 'expired';
    }

    res.json({
      success: true,
      data: {
        status,
        email: invitation.email,
        role: invitation.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (!invitation) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invitation' },
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: invitation.email });
    if (user) {
      // Update existing user's shared sites
      const newSites = invitation.sharedSites.filter(
        (sId) => !user.sharedSites.some((uId) => uId.equals(sId))
      );
      user.sharedSites.push(...newSites);
      if (invitation.sharedSiteTabs) {
        if (!user.sharedSiteTabs) user.sharedSiteTabs = new Map();
        for (const [sid, tabs] of invitation.sharedSiteTabs.entries()) {
          user.sharedSiteTabs.set(sid, tabs);
        }
      }
      if (!user.invitedBy) user.invitedBy = invitation.invitedBy;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email: invitation.email,
        name,
        password,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        sharedSites: invitation.sharedSites,
        sharedSiteTabs: invitation.sharedSiteTabs,
        emailVerified: true,
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    // Generate tokens (same as register flow)
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const userWithTokens = await User.findById(user._id).select('+refreshTokens');
    userWithTokens.refreshTokens.push(refreshToken);
    await userWithTokens.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};
