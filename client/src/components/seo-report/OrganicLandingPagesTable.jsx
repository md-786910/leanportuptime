import { themeColor } from './colorThemes';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatPct(val) {
  return `${(val * 100).toFixed(1)}%`;
}

export default function OrganicLandingPagesTable({ pages, themeKey }) {
  if (!pages || pages.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No landing page data available.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Organic Landing Pages
      </h4>
      <div className="overflow-x-auto rounded-lg border border-brand-outline-variant dark:border-brand-outline">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Page</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Sessions</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Bounce</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Engagement</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Avg Time</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/30 transition-colors">
                <td className="py-2 px-3 text-brand-outline dark:text-brand-on-surface-variant tabular-nums">{i + 1}</td>
                <td className="py-2 px-3 max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeColor(themeKey, i % 4) }}
                    />
                    <span className="text-brand-on-surface dark:text-brand-outline-variant font-mono text-xs truncate font-label" title={row.page}>
                      {row.page}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold" style={{ color: themeColor(themeKey, 0) }}>
                  {row.sessions.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {formatPct(row.bounceRate)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  <span className={row.engagementRate >= 0.6 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : row.engagementRate >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-brand-on-surface-variant dark:text-brand-outline'}>
                    {formatPct(row.engagementRate)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {formatDuration(row.avgDuration)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold text-brand-on-surface dark:text-white">
                  {row.conversions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
