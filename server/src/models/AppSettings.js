const mongoose = require('mongoose');

const MAX_KEYWORDS_PER_SITE = 250;
const LEGACY_MAX_KEYWORDS_PER_SITE = 30;

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true, index: true },
    backlinksMonthlyLimit: { type: Number, default: 4, min: 1, max: 1000 },
    keywordsMonthlyLimit: { type: Number, default: 4, min: 1, max: 1000 },
    maxKeywordsPerSite: { type: Number, default: MAX_KEYWORDS_PER_SITE, min: 1, max: 500 },
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
  // Upgrade docs created when the default was 30 (or missing the field).
  if (settings.maxKeywordsPerSite == null || settings.maxKeywordsPerSite === LEGACY_MAX_KEYWORDS_PER_SITE) {
    settings.maxKeywordsPerSite = MAX_KEYWORDS_PER_SITE;
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
