import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import { themeColor } from './colorThemes';
import EditKeywordModal from './EditKeywordModal';

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
  if (position == null) return 'text-brand-outline dark:text-brand-on-surface-variant';
  if (position <= 10) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (position <= 30) return 'text-amber-600 dark:text-amber-400';
  return 'text-brand-on-surface-variant dark:text-brand-outline';
}

export function DeltaCell({ position, previousPosition }) {
  if (position == null || previousPosition == null) {
    return <span className="text-brand-outline dark:text-brand-on-surface-variant">—</span>;
  }
  const delta = position - previousPosition;
  if (delta === 0) return <span className="text-brand-outline dark:text-brand-on-surface-variant">—</span>;
  if (delta < 0) {
    // Position improved (smaller number)
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold font-headline">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-bold font-headline">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {delta}
    </span>
  );
}

function KdBadge({ value }) {
  if (value == null) return <span className="text-brand-outline dark:text-brand-on-surface-variant">—</span>;
  const variant = value <= 30 ? 'success' : value <= 70 ? 'warning' : 'danger';
  return <Badge variant={variant}>{Math.round(value)}</Badge>;
}

function VolumeSparkline({ monthlySearches, themeKey }) {
  if (!monthlySearches?.length) return <span className="text-brand-outline dark:text-brand-on-surface-variant text-[10px] font-bold uppercase tracking-wider">—</span>;
  const sorted = [...monthlySearches].sort((a, b) =>
    (a.year * 100 + a.month) - (b.year * 100 + b.month)
  );
  const color = themeColor(themeKey, 1);
  return (
    <div className="w-20 h-8 mx-auto">
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

export default function KeywordRankingsTable({ items, isViewer, onRemove, removePending, themeKey, siteId }) {
  const [pendingRemove, setPendingRemove] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

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
      <div className="p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface-container-high dark:bg-brand-on-surface flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-headline font-bold mb-1">No keywords tracked yet</p>
        <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant font-medium uppercase tracking-wider max-w-[280px] mx-auto">
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
        <table className="w-full text-left">
          <thead className="bg-brand-surface-container-low border-b-0">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-8">#</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Keyword</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Position</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right w-12">Δ</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Volume</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-center">KD</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">CPC</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-center">Trend</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">URL</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Last check</th>
              {!isViewer && <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-surface-container dark:divide-brand-outline/30">
            {sortedItems.map((it, idx) => (
              <tr key={it.keyword} className="group hover:bg-brand-surface-container-low/50 dark:hover:bg-brand-on-surface/30 transition-colors">
                <td className="px-6 py-4 text-brand-outline tabular-nums text-xs">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-headline text-brand-on-surface dark:text-brand-outline-variant">{it.keyword}</span>
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
                <td className="px-6 py-4 text-right tabular-nums">
                  <span className={`text-sm font-extrabold font-headline ${positionClass(it.position)}`}>
                    {it.position == null ? 'Not ranked' : it.position}
                  </span>
                </td>
                <td className="px-6 py-4 text-right tabular-nums">
                  <DeltaCell position={it.position} previousPosition={it.previousPosition} />
                </td>
                <td className="px-6 py-4 text-right text-xs font-bold text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {fmt(it.searchVolume)}
                </td>
                <td className="px-6 py-4 text-center">
                  <KdBadge value={it.keywordDifficulty} />
                </td>
                <td className="px-6 py-4 text-right text-xs font-bold text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {it.cpc == null ? '—' : `$${it.cpc.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 text-center">
                  <VolumeSparkline monthlySearches={it.monthlySearches} themeKey={themeKey} />
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  {it.url ? (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={it.url}
                      className="block truncate text-xs font-medium text-brand-primary dark:text-brand-400 hover:underline"
                    >
                      {it.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <span className="text-brand-outline dark:text-brand-on-surface-variant text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline">
                  {timeAgo(it.lastCheckedAt)}
                </td>
                {!isViewer && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingItem(it)}
                        title="Edit keyword"
                        className="p-1.5 rounded-lg text-brand-outline hover:text-brand-primary hover:bg-brand-surface-container-high transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPendingRemove(it.keyword)}
                        title="Remove keyword"
                        className="p-1.5 rounded-lg text-brand-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                        </svg>
                      </button>
                    </div>
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

      <EditKeywordModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        siteId={siteId}
        item={editingItem}
      />
    </>
  );
}
