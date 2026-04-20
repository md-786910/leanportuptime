/**
 * Abstract base class for backlinks/domain-authority providers.
 * All concrete providers (DataForSEO, Moz, Ahrefs, etc.) must extend this
 * and implement fetchSummary(domain) returning the normalized response shape.
 *
 * Normalized response shape:
 *   {
 *     domainRank: Number,         // 0-100 normalized authority score
 *     backlinksCount: Number,
 *     referringDomains: Number,
 *     newLinksLast30d: Number,
 *     lostLinksLast30d: Number,
 *     providerName: String,       // "dataforseo" | "moz" | etc.
 *     providerMetric: String,     // "domain_rank" | "domain_authority" | "citation_flow"
 *     raw: Object,                // original provider response for debugging
 *   }
 *
 * fetchBacklinksList(domain, { limit }) → { items: [...], raw }
 * Each item: { sourceUrl, targetUrl, anchor, doFollow, firstSeen, lastSeen, linkType, domainFromRank }
 */
class BaseBacklinksProvider {
  constructor(config) {
    this.config = config || {};
  }

  get name() {
    throw new Error('Provider must override `name` getter');
  }

  isConfigured() {
    return false;
  }

  async fetchSummary(domain) { // eslint-disable-line no-unused-vars
    throw new Error('Provider must override fetchSummary(domain)');
  }

  // eslint-disable-next-line no-unused-vars
  async fetchBacklinksList(domain, { limit = 100 } = {}) {
    const err = new Error('Provider does not support per-link listing');
    err.code = 'FEATURE_NOT_SUPPORTED';
    err.statusCode = 501;
    throw err;
  }
}

module.exports = BaseBacklinksProvider;
