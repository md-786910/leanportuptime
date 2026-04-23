import { themeColor } from './colorThemes';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function OrganicCountryBreakdown({ countries, themeKey }) {
  if (!countries || countries.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No country data available.
      </p>
    );
  }

  const maxSessions = Math.max(...countries.map((c) => c.sessions));

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Top Countries (Organic)
      </h4>

      <div className="space-y-2">
        {countries.map((c, i) => {
          const pct = maxSessions > 0 ? (c.sessions / maxSessions) * 100 : 0;
          const color = themeColor(themeKey, i % 6);

          return (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-xs font-mono text-brand-on-surface-variant dark:text-brand-outline w-24 flex-shrink-0 truncate font-label">
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
                  {formatNumber(c.sessions)}
                </span>
                <span className="text-xs text-brand-outline dark:text-brand-on-surface-variant tabular-nums w-14 text-right font-label">
                  {(c.engagementRate * 100).toFixed(0)}% eng
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
