import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Drawer from '../common/Drawer';
import Button from '../common/Button';
import DateRangePicker from '../common/DateRangePicker';

const PRESETS = [
  { key: '1m',  label: 'Last 1 mo',  months: 1 },
  { key: '3m',  label: 'Last 3 mo',  months: 3 },
  { key: '6m',  label: 'Last 6 mo',  months: 6 },
  { key: '12m', label: 'Last 12 mo', months: 12 },
  { key: 'custom', label: 'Custom' },
];

const METRICS = [
  // `aggregate`: 'end' = use end-of-range snapshot; 'sum' = sum across range buckets.
  { key: 'domainRank',       historyKey: 'rank',              label: 'Domain Authority', lowerIsBetter: false, hint: 'Provider score', aggregate: 'end' },
  { key: 'backlinksCount',   historyKey: 'backlinks',         label: 'Backlinks',        lowerIsBetter: false, hint: 'Total inbound',  aggregate: 'end' },
  { key: 'referringDomains', historyKey: 'referringDomains',  label: 'Ref. Domains',     lowerIsBetter: false, hint: 'Unique sources', aggregate: 'end' },
  { key: 'newLinksLast30d',  historyKey: 'newBacklinks',      label: 'New Links',        lowerIsBetter: false, hint: 'Gained',         aggregate: 'sum' },
  { key: 'lostLinksLast30d', historyKey: 'lostBacklinks',     label: 'Lost Links',       lowerIsBetter: true,  hint: 'Lost',           aggregate: 'sum' },
];

function fmtNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function monthKeyFromDate(d) {
  return format(d, 'yyyy-MM');
}

function monthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return format(d, 'MMM yyyy');
}

function rangeLabel(startKey, endKey) {
  if (!startKey || !endKey) return '';
  if (startKey === endKey) return monthLabel(startKey);
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, ey_y] = [Number(endKey.split('-')[0]), Number(endKey.split('-')[1])];
  const startD = new Date(sy, sm - 1, 1);
  const endD = new Date(ey, ey_y - 1, 1);
  const sameYear = sy === ey;
  return sameYear
    ? `${format(startD, 'MMM')} – ${format(endD, 'MMM yyyy')}`
    : `${format(startD, 'MMM yyyy')} – ${format(endD, 'MMM yyyy')}`;
}

// Enumerate all monthKeys between two Date objects (inclusive of both endpoints' months).
function enumerateMonthKeys(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const out = [];
  let cursor = startOfMonth(startDate);
  const end = startOfMonth(endDate);
  while (cursor.getTime() <= end.getTime()) {
    out.push(monthKeyFromDate(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return out;
}

function DeltaCell({ current, previous, lowerIsBetter, available }) {
  if (!available) {
    return <span className="text-[11px] text-brand-outline font-label">—</span>;
  }
  const cur = Number(current ?? 0);
  const prev = Number(previous ?? 0);
  const delta = cur - prev;

  if (delta === 0) {
    return <span className="text-[11px] text-brand-outline-variant font-label">No change</span>;
  }

  const isUp = delta > 0;
  const positive = lowerIsBetter ? !isUp : isUp;
  const colorCls = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400';
  const arrow = isUp ? '↑' : '↓';
  const sign = isUp ? '+' : '−';
  const absDelta = Math.abs(delta);
  const pct = prev === 0 ? null : Math.abs((delta / prev) * 100);

  return (
    <div className={`flex flex-col items-end gap-0 leading-tight ${colorCls}`}>
      <span className="text-sm font-bold tabular-nums font-label">{sign}{fmtNumber(absDelta)}</span>
      <span className="text-[10px] tabular-nums font-label opacity-90">
        {arrow} {pct == null ? '—' : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

export default function CompareDomainAuthorityModal({ isOpen, onClose, current, onHistoryClick }) {
  const [presetKey, setPresetKey] = useState('1m');
  const [customRange, setCustomRange] = useState(() => {
    const lastMonth = subMonths(new Date(), 1);
    return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
  });

  useEffect(() => {
    if (!isOpen) return;
    setPresetKey('1m');
    const lastMonth = subMonths(new Date(), 1);
    setCustomRange([startOfMonth(lastMonth), endOfMonth(lastMonth)]);
  }, [isOpen]);

  // Derive [startDate, endDate] for the active selection.
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (presetKey === 'custom') return customRange;
    const preset = PRESETS.find((p) => p.key === presetKey);
    const months = preset?.months || 1;
    // Range = the N months immediately preceding the current month.
    const end = endOfMonth(subMonths(new Date(), 1));
    const start = startOfMonth(subMonths(new Date(), months));
    return [start, end];
  }, [presetKey, customRange]);

  // Buckets in the selected range.
  const { bucketsInRange, endBucket, available } = useMemo(() => {
    const history = current?.history || [];
    if (!rangeStart || !rangeEnd) return { bucketsInRange: [], endBucket: null, available: false };
    const monthKeys = enumerateMonthKeys(rangeStart, rangeEnd);
    const keySet = new Set(monthKeys);
    const inRange = history.filter((h) => keySet.has(h.monthKey));
    const endKey = monthKeys[monthKeys.length - 1];
    const end = history.find((h) => h.monthKey === endKey) || null;
    return {
      bucketsInRange: inRange,
      endBucket: end,
      available: inRange.length > 0,
    };
  }, [current?.history, rangeStart, rangeEnd]);

  const headerLabel = useMemo(() => {
    if (!rangeStart || !rangeEnd) return '';
    return rangeLabel(monthKeyFromDate(rangeStart), monthKeyFromDate(rangeEnd));
  }, [rangeStart, rangeEnd]);

  // Compute the comparison value for a single metric across the range.
  const compareValueFor = (metric) => {
    if (!available) return null;
    if (metric.aggregate === 'sum') {
      return bucketsInRange.reduce((acc, b) => acc + (b[metric.historyKey] || 0), 0);
    }
    // 'end' — use end-of-range snapshot if present, else latest available bucket in range
    if (endBucket) return endBucket[metric.historyKey] ?? null;
    const last = bucketsInRange[bucketsInRange.length - 1];
    return last ? (last[metric.historyKey] ?? null) : null;
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Domain Authority"
      width="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          {typeof onHistoryClick === 'function' ? (
            <button
              type="button"
              onClick={onHistoryClick}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors font-label"
              title="View change history"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          ) : <span />}
          <Button type="button" onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Period selector */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-outline dark:text-brand-on-surface-variant font-label ml-0.5">
            Compare with
          </p>
          <div className="flex flex-wrap items-center gap-1 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-lg p-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPresetKey(p.key)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap font-label ${
                  presetKey === p.key
                    ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm'
                    : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {presetKey === 'custom' && (
            <div className="pt-1">
              <DateRangePicker
                startDate={customRange[0]}
                endDate={customRange[1]}
                onChange={(dates) => setCustomRange(dates)}
                maxDate={new Date()}
                align="left"
                placeholderStart="Start month"
                placeholderEnd="End month"
              />
            </div>
          )}
        </div>

        {/* Comparison summary chip */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-brand-surface-container-low dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Comparing</div>
              <div className="text-sm font-bold text-brand-on-surface dark:text-white font-label truncate">
                This Month  vs  {headerLabel || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Empty-state callout */}
        {!available && headerLabel && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No data for {headerLabel}. Use <strong>Edit</strong> → pick a past date to backfill any month in this range.</span>
          </div>
        )}

        {/* Comparison table — metric rows */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">This Month</th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">{headerLabel || '—'}</th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => {
                const cur = current?.[m.key];
                const prev = compareValueFor(m);
                return (
                  <tr key={m.key} className={`${i > 0 ? 'border-t border-gray-50 dark:border-brand-outline' : ''} hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors`}>
                    <td className="py-2.5 px-3">
                      <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">
                        {m.label}
                      </div>
                      <div className="text-[10px] text-brand-outline font-label mt-0.5">
                        {m.aggregate === 'sum' ? 'sum across range' : 'end of range'}
                        {m.lowerIsBetter ? ' · lower is better' : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">
                      {fmtNumber(cur)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                      {available ? fmtNumber(prev) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <DeltaCell current={cur} previous={prev} lowerIsBetter={m.lowerIsBetter} available={available} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        {available && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-brand-surface-container-low dark:bg-brand-on-surface/40 text-brand-on-surface-variant dark:text-brand-outline">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Need older data? Use <strong>Edit</strong> → pick a past date to backfill any month.</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
