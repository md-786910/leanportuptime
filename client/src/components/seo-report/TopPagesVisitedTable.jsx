import { themeColor } from './colorThemes';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function TopPagesVisitedTable({ pages, themeKey }) {
  if (!pages || pages.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No page view data available.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Top Pages Visited
      </h4>
      <div className="overflow-x-auto rounded-lg border border-brand-outline-variant dark:border-brand-outline">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Page</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Page Views</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/30 transition-colors">
                <td className="py-2 px-3 text-brand-outline dark:text-brand-on-surface-variant tabular-nums">{i + 1}</td>
                <td className="py-2 px-3 max-w-[350px]">
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
                  {formatNumber(row.pageViews)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
