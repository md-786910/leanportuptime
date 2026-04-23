import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { themeColor } from './colorThemes';

// Common country code → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 3) return '';
  // ISO 3166-1 alpha-3 to alpha-2 for flag emoji — simplified mapping
  const alpha3to2 = {
    USA: 'US', GBR: 'GB', DEU: 'DE', FRA: 'FR', IND: 'IN', CAN: 'CA', AUS: 'AU',
    BRA: 'BR', JPN: 'JP', KOR: 'KR', MEX: 'MX', ESP: 'ES', ITA: 'IT', NLD: 'NL',
    RUS: 'RU', CHN: 'CN', IDN: 'ID', TUR: 'TR', SAU: 'SA', ARE: 'AE', PAK: 'PK',
    BGD: 'BD', NGA: 'NG', EGY: 'EG', ZAF: 'ZA', ARG: 'AR', COL: 'CO', POL: 'PL',
    UKR: 'UA', THA: 'TH', VNM: 'VN', PHL: 'PH', MYS: 'MY', SGP: 'SG', SWE: 'SE',
    NOR: 'NO', DNK: 'DK', FIN: 'FI', CHE: 'CH', AUT: 'AT', BEL: 'BE', PRT: 'PT',
    GRC: 'GR', CZE: 'CZ', ROU: 'RO', HUN: 'HU', IRL: 'IE', NZL: 'NZ', CHL: 'CL',
    PER: 'PE', ISR: 'IL', HKG: 'HK', TWN: 'TW',
  };
  const a2 = alpha3to2[code.toUpperCase()] || code.slice(0, 2).toUpperCase();
  return String.fromCodePoint(...[...a2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function CountryBreakdown({ countries, themeKey }) {
  if (!countries || countries.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No country data available.
      </p>
    );
  }

  const maxClicks = Math.max(...countries.map((c) => c.clicks));
  const chartData = countries.map((c) => ({
    name: c.country,
    clicks: c.clicks,
  }));

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Top Countries
      </h4>

      <div className="space-y-2">
        {countries.map((c, i) => {
          const pct = maxClicks > 0 ? (c.clicks / maxClicks) * 100 : 0;
          const color = themeColor(themeKey, i % 6);

          return (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{countryFlag(c.country)}</span>
              <span className="text-xs  text-brand-on-surface-variant dark:text-brand-outline w-8 flex-shrink-0 uppercase font-label">
                {c.country}
              </span>
              <div className="flex-1 h-5 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold font-label text-brand-on-surface dark:text-white tabular-nums w-16 text-right">
                  {formatNumber(c.clicks)}
                </span>
                <span className="text-xs text-brand-outline dark:text-brand-on-surface-variant tabular-nums w-16 text-right font-label">
                  {formatNumber(c.impressions)} imp
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
