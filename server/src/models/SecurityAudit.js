const mongoose = require('mongoose');

const securityCheckSchema = new mongoose.Schema(
  {
    check: { type: String, required: true },
    status: { type: String, enum: ['pass', 'fail', 'warn'], required: true },
    message: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  },
  { _id: false }
);

const securityAuditSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    checks: [securityCheckSchema],
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalChecks: Number,
    passedChecks: Number,
    failedChecks: Number,
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

securityAuditSchema.index({ siteId: 1, scannedAt: -1 });

module.exports = mongoose.model('SecurityAudit', securityAuditSchema);
