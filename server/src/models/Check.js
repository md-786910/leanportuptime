const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['up', 'down', 'degraded'],
      required: true,
      index: true,
    },
    httpStatus: Number,
    responseTime: Number,
    ttfb: Number,
    dnsTime: Number,
    tlsTime: Number,
    pageSize: Number,
    wpVersion: String,
    phpVersion: String,
    keywordMatch: Boolean,
    missingKeywords: [String],
    error: String,
    location: { type: String, default: 'local' },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient site + time queries
checkSchema.index({ siteId: 1, timestamp: -1 });

// TTL index - default 90 days, managed per plan via aggregation cleanup
checkSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Check', checkSchema);
