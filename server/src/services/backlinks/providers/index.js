const config = require('../../../config');
const DataForSEOProvider = require('./DataForSEOProvider');
// Future: const MozProvider = require('./MozProvider');
// Future: const AhrefsProvider = require('./AhrefsProvider');

const PROVIDERS = {
  dataforseo: DataForSEOProvider,
  // moz: MozProvider,
  // ahrefs: AhrefsProvider,
};

function getProvider() {
  const name = config.backlinks.provider;
  const ProviderClass = PROVIDERS[name];
  if (!ProviderClass) {
    const err = new Error(`Unknown backlinks provider: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  const providerConfig = config.backlinks.providers[name] || {};
  return new ProviderClass(providerConfig);
}

function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

module.exports = { getProvider, getAvailableProviders };
