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
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        No landing page data available.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Organic Landing Pages
      </h4>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Page</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Sessions</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Bounce</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Engagement</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Avg Time</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="py-2 px-3 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                <td className="py-2 px-3 max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeColor(themeKey, i % 4) }}
                    />
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-xs truncate" title={row.page}>
                      {row.page}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold" style={{ color: themeColor(themeKey, 0) }}>
                  {row.sessions.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {formatPct(row.bounceRate)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  <span className={row.engagementRate >= 0.6 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : row.engagementRate >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}>
                    {formatPct(row.engagementRate)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {formatDuration(row.avgDuration)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
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
