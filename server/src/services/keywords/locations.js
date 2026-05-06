// Allowed DataForSEO locations exposed via the Manage Keywords UI.
// Keep in sync with client/src/components/seo-report/keywordLocations.js.

const KEYWORD_LOCATIONS = [
  { code: 2276, language: 'de', label: 'Germany' },
  { code: 2040, language: 'de', label: 'Austria' },
  { code: 2756, language: 'de', label: 'Switzerland' },
  { code: 2840, language: 'en', label: 'United States' },
  { code: 2826, language: 'en', label: 'United Kingdom' },
  { code: 2250, language: 'fr', label: 'France' },
  { code: 2380, language: 'it', label: 'Italy' },
  { code: 2724, language: 'es', label: 'Spain' },
  { code: 2528, language: 'nl', label: 'Netherlands' },
  { code: 2056, language: 'nl', label: 'Belgium' },
  { code: 2616, language: 'pl', label: 'Poland' },
  { code: 2124, language: 'en', label: 'Canada' },
  { code: 2036, language: 'en', label: 'Australia' },
  { code: 2356, language: 'en', label: 'India' },
];

const BY_CODE = new Map(KEYWORD_LOCATIONS.map((l) => [l.code, l]));

function findLocation(code) {
  return BY_CODE.get(Number(code)) || null;
}

// Validates an incoming `{ locationCode, languageCode }` pair against the catalogue.
// Returns a normalized `{ locationCode, languageCode }` or null if invalid.
function normalizeLocation(input) {
  if (!input) return null;
  const code = Number(input.locationCode);
  if (!Number.isFinite(code)) return null;
  const found = findLocation(code);
  if (!found) return null;
  const lang = typeof input.languageCode === 'string' && input.languageCode
    ? input.languageCode.toLowerCase()
    : found.language;
  return { locationCode: found.code, languageCode: lang };
}

module.exports = {
  KEYWORD_LOCATIONS,
  findLocation,
  normalizeLocation,
};
