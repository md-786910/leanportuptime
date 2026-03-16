const mongoose = require('mongoose');

const checkResultSchema = new mongoose.Schema(
  {
    check: { type: String, required: true },
    category: {
      type: String,
      enum: ['performance', 'bugs', 'malware'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'warn'],
      required: true,
    },
    message: String,
    detail: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const siteScanSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    checks: [checkResultSchema],

    score: { type: Number, min: 0, max: 100 },
    totalChecks: Number,
    passedChecks: Number,
    failedChecks: Number,
    warnChecks: Number,

    performanceScore: { type: Number, min: 0, max: 100 },
    bugsScore: { type: Number, min: 0, max: 100 },
    malwareScore: { type: Number, min: 0, max: 100 },

    responseTime: Number,
    pageSize: Number,
    resourceCounts: {
      scripts: Number,
      stylesheets: Number,
      images: Number,
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

siteScanSchema.index({ siteId: 1, scannedAt: -1 });

module.exports = mongoose.model('SiteScan', siteScanSchema);
