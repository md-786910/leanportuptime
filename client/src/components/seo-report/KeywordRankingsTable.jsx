import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import { themeColor } from './colorThemes';

export function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function positionClass(position) {
  if (position == null) return 'text-gray-400 dark:text-gray-500';
  if (position <= 10) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (position <= 30) return 'text-amber-600 dark:text-amber-400';
  return 'text-gray-500 dark:text-gray-400';
}

export function DeltaCell({ position, previousPosition }) {
  if (position == null || previousPosition == null) {
    return <span className="text-gray-300 dark:text-gray-600">—</span>;
  }
  const delta = position - previousPosition;
  if (delta === 0) return <span className="text-gray-400 dark:text-gray-500">—</span>;
  if (delta < 0) {
    // Position improved (smaller number)
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {delta}
    </span>
  );
}

function KdBadge({ value }) {
  if (value == null) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const variant = value <= 30 ? 'success' : value <= 70 ? 'warning' : 'danger';
  return <Badge variant={variant}>{Math.round(value)}</Badge>;
}

function VolumeSparkline({ monthlySearches, themeKey }) {
  if (!monthlySearches?.length) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  const sorted = [...monthlySearches].sort((a, b) =>
    (a.year * 100 + a.month) - (b.year * 100 + b.month)
  );
  const color = themeColor(themeKey, 1);
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sorted} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`volGrad-${themeKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="searchVolume"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#volGrad-${themeKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function KeywordRankingsTable({ items, isViewer, onRemove, removePending, themeKey }) {
  const [pendingRemove, setPendingRemove] = useState(null);

  const sortedItems = [...(items || [])].sort((a, b) => {
    const ap = a.position;
    const bp = b.position;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;   // unranked → bottom
    if (bp == null) return -1;
    return ap - bp;             // smaller position = better = first
  });

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-gray-200 dark:border-gray-700">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-xs font-semibold text-gray-500 mb-1">No keywords tracked yet</p>
        <p className="text-[10px] text-gray-400 text-center max-w-[280px]">
          {isViewer
            ? 'Contact the site owner to add keywords to track their SERP positions.'
            : 'Click Manage Keywords to add your first one — paste a list or enter keywords one by one.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 px-2 font-medium">#</th>
              <th className="py-2 px-2 font-medium">Keyword</th>
              <th className="py-2 px-2 font-medium text-right">Position</th>
              <th className="py-2 px-2 font-medium text-right">Δ</th>
              <th className="py-2 px-2 font-medium text-right">Volume</th>
              <th className="py-2 px-2 font-medium text-center">KD</th>
              <th className="py-2 px-2 font-medium text-right">CPC</th>
              <th className="py-2 px-2 font-medium text-center">Vol. trend</th>
              <th className="py-2 px-2 font-medium">URL</th>
              <th className="py-2 px-2 font-medium">Last check</th>
              {!isViewer && <th className="py-2 px-2 font-medium w-10" />}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((it, idx) => (
              <tr key={it.keyword} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                <td className="py-2 px-2 text-gray-400 tabular-nums">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <span>{it.keyword}</span>
                    {it.lastCheckError && (
                      <span
                        title={it.lastCheckError}
                        className="text-amber-500"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  <span className={positionClass(it.position)}>
                    {it.position == null ? 'Not ranked' : it.position}
                  </span>
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  <DeltaCell position={it.position} previousPosition={it.previousPosition} />
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {fmt(it.searchVolume)}
                </td>
                <td className="py-2 px-2 text-center">
                  <KdBadge value={it.keywordDifficulty} />
                </td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {it.cpc == null ? '—' : `$${it.cpc.toFixed(2)}`}
                </td>
                <td className="py-2 px-2 text-center">
                  <VolumeSparkline monthlySearches={it.monthlySearches} themeKey={themeKey} />
                </td>
                <td className="py-2 px-2 text-gray-500 dark:text-gray-400 max-w-[200px]">
                  {it.url ? (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={it.url}
                      className="block truncate text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {it.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="py-2 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {timeAgo(it.lastCheckedAt)}
                </td>
                {!isViewer && (
                  <td className="py-2 px-2">
                    <button
                      onClick={() => setPendingRemove(it.keyword)}
                      title="Remove keyword"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          onRemove?.(pendingRemove);
          setPendingRemove(null);
        }}
        title="Remove keyword"
        message={`Stop tracking "${pendingRemove}"? This also clears its position history.`}
        confirmText="Remove"
        isLoading={removePending}
      />
    </>
  );
}
