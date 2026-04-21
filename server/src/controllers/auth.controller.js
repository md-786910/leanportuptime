const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const config = require("../config");
const logger = require("../utils/logger");
const notificationService = require("../services/notification.service");

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

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "DUPLICATE_ERROR", message: "Email already registered" },
      });
    }

    const user = await User.create({ email, password, name });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "strict",
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

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +refreshTokens +failedLoginAttempts +lockUntil",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_FAILED", message: "Invalid email or password" },
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: "Account is temporarily locked. Try again later.",
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 10) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();

      return res.status(401).json({
        success: false,
        error: { code: "AUTH_FAILED", message: "Invalid email or password" },
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Keep only last 5 refresh tokens
    user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Refresh token required" },
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId).select("+refreshTokens");

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid refresh token" },
      });
    }

    // Rotate: remove old, add new
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const user = await User.findById(req.user._id).select("+refreshTokens");
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(
          (t) => t !== refreshToken,
        );
        await user.save();
      }
    }

    res.clearCookie("refreshToken");
    res.json({ success: true, data: { message: "Logged out" } });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        data: { message: "If that email exists, a reset link was sent" },
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

    try {
      await notificationService.sendPasswordResetEmail(email, resetUrl);
      logger.info(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error(
        `Failed to send password reset email to ${email}: ${emailError.message}`,
      );
    }

    res.json({
      success: true,
      data: { message: "If that email exists, a reset link was sent" },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired reset token",
        },
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, data: { message: "Password reset successful" } });
  } catch (error) {
    next(error);
  }
};
