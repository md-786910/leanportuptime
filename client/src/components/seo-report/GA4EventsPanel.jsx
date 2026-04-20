import { useState, useMemo } from 'react';
import { themeColor } from './colorThemes';

const FORM_EVENT_NAMES = new Set([
  'generate_lead',
  'form_submit',
  'form_start',
  'contact_form',
  'form_submission',
  'contact_form_submit',
  'wpforms_submit',
]);

const ENGAGEMENT_EVENTS = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'scroll',
  'click',
  'user_engagement',
  'view_search_results',
  'view_item',
]);

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function eventBadge(eventName) {
  if (eventName === 'file_download') {
    return { label: 'Download', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  }
  if (FORM_EVENT_NAMES.has(eventName)) {
    return { label: 'Form', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  }
  if (ENGAGEMENT_EVENTS.has(eventName)) {
    return { label: 'Engagement', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
  if (eventName.startsWith('purchase') || eventName === 'add_to_cart' || eventName === 'begin_checkout') {
    return { label: 'Ecommerce', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  }
  return null;
}

export default function GA4EventsPanel({ events, themeKey }) {
  const [expanded, setExpanded] = useState(false);
  const list = Array.isArray(events) ? events : [];

  const { totalCount, maxCount, sorted } = useMemo(() => {
    const total = list.reduce((sum, e) => sum + (e.eventCount || 0), 0);
    const max = list.reduce((m, e) => Math.max(m, e.eventCount || 0), 0);
    const s = [...list].sort((a, b) => (b.eventCount || 0) - (a.eventCount || 0));
    return { totalCount: total, maxCount: max, sorted: s };
  }, [list]);

  const visibleRows = expanded ? sorted : sorted.slice(0, 20);
  const hasMore = sorted.length > 20;

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Event and clicks
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Every event tracked during this period — use this to identify real event names in your GA4 setup.
          </p>
        </div>
        {sorted.length > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Total events</div>
            <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{formatNumber(totalCount)}</div>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">No events tracked in this period.</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Ensure GA4 tag is installed and firing on your site.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Event Name</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Count</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Users</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">Share</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((e, i) => {
                const badge = eventBadge(e.eventName);
                const pct = maxCount > 0 ? (e.eventCount / maxCount) * 100 : 0;
                const sharePct = totalCount > 0 ? ((e.eventCount / totalCount) * 100).toFixed(1) : '0.0';
                const barColor = themeColor(themeKey, i % 6);
                return (
                  <tr key={e.eventName} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-2 px-3 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                    <td className="py-2 px-3 max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate" title={e.eventName}>
                          {e.eventName}
                        </span>
                        {badge && (
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${badge.classes}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                      {formatNumber(e.eventCount)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {formatNumber(e.totalUsers)}
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums w-10 text-right">
                          {sharePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {expanded ? `Show top 20 only` : `Show all ${sorted.length} events`}
          </button>
        </div>
      )}
    </div>
  );
}
