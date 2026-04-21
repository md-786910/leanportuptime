const config = require('../../../config');
const DataForSEORankProvider = require('./DataForSEORankProvider');

const PROVIDERS = {
  dataforseo: DataForSEORankProvider,
};

function getProvider() {
  const name = config.keywords.provider;
  const ProviderClass = PROVIDERS[name];
  if (!ProviderClass) {
    const err = new Error(`Unknown keywords provider: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  const providerConfig = config.keywords.providers[name] || {};
  return new ProviderClass(providerConfig);
}

function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

module.exports = { getProvider, getAvailableProviders };
