const mongoose = require('mongoose');

const sslCertSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    issuer: String,
    subject: String,
    validFrom: Date,
    validTo: Date,
    daysRemaining: Number,
    serialNumber: String,
    fingerprint: String,
    protocol: String,
    cipher: String,
    keyExchange: String,
    isValid: Boolean,
    error: String,
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sslCertSchema.index({ siteId: 1, checkedAt: -1 });

module.exports = mongoose.model('SSLCert', sslCertSchema);
