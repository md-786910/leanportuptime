const mongoose = require('mongoose');

const seoCheckResultSchema = new mongoose.Schema(
  {
    check: { type: String, required: true },
    category: {
      type: String,
      enum: ['meta-tags', 'content', 'links', 'performance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'warn'],
      required: true,
    },
    message: String,
    detail: String,
    impact: String,
    fix: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const seoAuditSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    checks: [seoCheckResultSchema],

    score: { type: Number, min: 0, max: 100 },
    totalChecks: Number,
    passedChecks: Number,
    failedChecks: Number,
    warnChecks: Number,

    metaTagsScore: { type: Number, min: 0, max: 100 },
    contentScore: { type: Number, min: 0, max: 100 },
    linksScore: { type: Number, min: 0, max: 100 },
    performanceScore: { type: Number, min: 0, max: 100 },

    pageSpeedError: String,

    pageSpeed: {
      mobile: {
        performance: Number,
        accessibility: Number,
        bestPractices: Number,
        seo: Number,
        fcp: Number,
        lcp: Number,
        tbt: Number,
        cls: Number,
        si: Number,
        inp: Number,
        fid: Number,
        ttfb: Number,
      },
      desktop: {
        performance: Number,
        accessibility: Number,
        bestPractices: Number,
        seo: Number,
        fcp: Number,
        lcp: Number,
        tbt: Number,
        cls: Number,
        si: Number,
        inp: Number,
        fid: Number,
        ttfb: Number,
      },
      fetchedAt: Date,
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

seoAuditSchema.index({ siteId: 1, scannedAt: -1 });

module.exports = mongoose.model('SeoAudit', seoAuditSchema);
