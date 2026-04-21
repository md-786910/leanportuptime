const { getProvider } = require('./providers');

class KeywordsService {
  async fetchRank(keyword, opts) {
    const provider = getProvider();
    return provider.fetchRank(keyword, opts);
  }

  async fetchMetrics(keywords, opts) {
    const provider = getProvider();
    return provider.fetchMetrics(keywords, opts);
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

  currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

module.exports = new KeywordsService();
