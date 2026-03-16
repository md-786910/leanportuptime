const mongoose = require('mongoose');

const pluginEntrySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: String,
    detectedVersion: String,
    latestVersion: String,
    isOutdated: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    isMalicious: { type: Boolean, default: false },
    malwareFindings: { type: [String], default: [] },
    isVulnerable: { type: Boolean, default: false },
    vulnerabilities: [
      {
        title: String,
        severity: String,
        solution: String,
        _id: false,
      },
    ],
    solution: String,
    lastUpdated: Date,
    activeInstalls: Number,
    wpCompatibility: String,
    status: {
      type: String,
      enum: ['ok', 'warn', 'critical'],
      default: 'ok',
    },
  },
  { _id: false }
);

const pluginAuditSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    plugins: [pluginEntrySchema],
    totalPlugins: { type: Number, default: 0 },
    issueCount: { type: Number, default: 0 },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

pluginAuditSchema.index({ siteId: 1, scannedAt: -1 });

module.exports = mongoose.model('PluginAudit', pluginAuditSchema);
