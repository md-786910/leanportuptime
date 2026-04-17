const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true, index: true },
    backlinksMonthlyLimit: { type: Number, default: 4, min: 1, max: 1000 },
  },
  { timestamps: true }
);

/**
 * Singleton accessor — always returns the single 'global' settings document.
 * Creates it with defaults on first call.
 */
appSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
