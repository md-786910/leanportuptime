const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['down', 'up', 'ssl_expiry', 'security_alert', 'degraded'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'slack', 'discord', 'webhook'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    error: String,
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
