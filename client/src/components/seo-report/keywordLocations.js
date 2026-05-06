// Shared catalogue of DataForSEO locations exposed in the Manage Keywords UI.
// Keep in sync with server/src/services/keywords/locations.js.

export const KEYWORD_LOCATIONS = [
  { code: 2276, language: 'de', label: 'Germany',        short: 'DE', flag: '🇩🇪' },
  { code: 2040, language: 'de', label: 'Austria',        short: 'AT', flag: '🇦🇹' },
  { code: 2756, language: 'de', label: 'Switzerland',    short: 'CH', flag: '🇨🇭' },
  { code: 2840, language: 'en', label: 'United States',  short: 'US', flag: '🇺🇸' },
  { code: 2826, language: 'en', label: 'United Kingdom', short: 'UK', flag: '🇬🇧' },
  { code: 2250, language: 'fr', label: 'France',         short: 'FR', flag: '🇫🇷' },
  { code: 2380, language: 'it', label: 'Italy',          short: 'IT', flag: '🇮🇹' },
  { code: 2724, language: 'es', label: 'Spain',          short: 'ES', flag: '🇪🇸' },
  { code: 2528, language: 'nl', label: 'Netherlands',    short: 'NL', flag: '🇳🇱' },
  { code: 2056, language: 'nl', label: 'Belgium',        short: 'BE', flag: '🇧🇪' },
  { code: 2616, language: 'pl', label: 'Poland',         short: 'PL', flag: '🇵🇱' },
  { code: 2124, language: 'en', label: 'Canada',         short: 'CA', flag: '🇨🇦' },
  { code: 2036, language: 'en', label: 'Australia',      short: 'AU', flag: '🇦🇺' },
  { code: 2356, language: 'en', label: 'India',          short: 'IN', flag: '🇮🇳' },
];

export const DEFAULT_LOCATION_CODE = 2276;
export const DEFAULT_LANGUAGE_CODE = 'de';

export function findLocation(code) {
  return KEYWORD_LOCATIONS.find((l) => l.code === code) || null;
}

export function locationLabel(code, language) {
  const found = findLocation(code);
  if (found) return `${found.flag} ${found.short}`;
  if (code) return `${code}${language ? ` (${language})` : ''}`;
  return '—';
}
