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
}

module.exports = BaseBacklinksProvider;
