const config = require('../../config');
const { getProvider } = require('./providers');

class BacklinksService {
  isStale(lastFetchedAt) {
    if (!lastFetchedAt) return true;
    const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
    const cacheMs = config.backlinks.cacheDays * 24 * 60 * 60 * 1000;
    return ageMs > cacheMs;
  }

  async fetchSummary(domain) {
    const provider = getProvider();
    return provider.fetchSummary(domain);
  }

  getProviderInfo() {
    try {
      const provider = getProvider();
      return {
        name: provider.name,
        configured: provider.isConfigured(),
      };
    } catch (err) {
      return { name: 'unknown', configured: false, error: err.message };
    }
  }

  /**
   * Get current month key in "YYYY-MM" format.
   * Used for auto-resetting the monthly refresh counter.
   */
  currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

module.exports = new BacklinksService();
