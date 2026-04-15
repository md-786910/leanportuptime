const mongoose = require('mongoose');
const crypto = require('crypto');

const shareLinkSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    visibleSections: {
      overview: { type: Boolean, default: true },
      performance: { type: Boolean, default: true },
      ssl: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      seo: { type: Boolean, default: true },
      plugins: { type: Boolean, default: true },
      sitescan: { type: Boolean, default: true },
      history: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: Date,
    accessCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

shareLinkSchema.index({ siteId: 1, userId: 1 });
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

shareLinkSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('ShareLink', shareLinkSchema);
