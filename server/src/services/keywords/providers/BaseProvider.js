/**
 * Abstract base class for keyword SERP rank + metrics providers.
 * Concrete providers (DataForSEO, etc.) extend this.
 *
 * fetchRank(keyword, { locationCode, languageCode, targetDomain })
 *   → { position: Number|null, url: String|null, raw: Object }
 *
 * fetchMetrics(keywords, { locationCode, languageCode })
 *   → { [keyword]: { searchVolume, keywordDifficulty, cpc, competition, monthlySearches[] } }
 */
class BaseKeywordsProvider {
  constructor(config) {
    this.config = config || {};
  }

  get name() {
    throw new Error('Provider must override `name` getter');
  }

  isConfigured() {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async fetchRank(keyword, opts) {
    throw new Error('Provider must override fetchRank(keyword, opts)');
  }

  // eslint-disable-next-line no-unused-vars
  async fetchMetrics(keywords, opts) {
    const err = new Error('Provider does not support keyword metrics');
    err.code = 'FEATURE_NOT_SUPPORTED';
    err.statusCode = 501;
    throw err;
  }
}

module.exports = BaseKeywordsProvider;
