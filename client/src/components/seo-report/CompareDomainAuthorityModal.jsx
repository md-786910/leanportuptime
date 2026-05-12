import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import Drawer from '../common/Drawer';
import ComparePeriodSelector from './compare/ComparePeriodSelector';
import RangeHeaderButton from './compare/RangeHeaderButton';
import { useComparePeriods } from './compare/useComparePeriods';

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

function bucketsForRange(history, startDate, endDate) {
  if (!startDate || !endDate) return { buckets: [], endBucket: null, available: false };
  const monthKeys = enumerateMonthKeys(startDate, endDate);
  const keySet = new Set(monthKeys);
  const inRange = history.filter((h) => keySet.has(h.monthKey));
  const endKey = monthKeys[monthKeys.length - 1];
  const endBucket = history.find((h) => h.monthKey === endKey) || null;
  return {
    buckets: inRange,
    endBucket,
    available: inRange.length > 0,
  };
}

function valueFromBuckets(metric, { buckets, endBucket, available }) {
  if (!available) return null;
  if (metric.aggregate === 'sum') {
    return buckets.reduce((acc, b) => acc + (b[metric.historyKey] || 0), 0);
  }
  if (endBucket) return endBucket[metric.historyKey] ?? null;
  const last = buckets[buckets.length - 1];
  return last ? (last[metric.historyKey] ?? null) : null;
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
  const cmp = useComparePeriods({ isOpen });

  const history = current?.history || [];

  // Comparison column always derives from history buckets in the compareRange.
  const compareInfo = useMemo(
    () => bucketsForRange(history, cmp.compareRange.start, cmp.compareRange.end),
    [history, cmp.compareRange.start, cmp.compareRange.end],
  );

  // Current column: in custom mode also derives from history; otherwise use the snapshot fields on `current`.
  const customCurrentInfo = useMemo(
    () => (cmp.isCustom ? bucketsForRange(history, cmp.currentRange.start, cmp.currentRange.end) : null),
    [cmp.isCustom, history, cmp.currentRange.start, cmp.currentRange.end],
  );

  const currentColLabel = cmp.isCustom ? (cmp.currentLabelText || '—') : 'This Month';
  const compareColLabel = cmp.compareLabelText || '—';

  const compareAvailable = compareInfo.available;
  const currentAvailable = cmp.isCustom ? !!customCurrentInfo?.available : true;
  const available = compareAvailable && currentAvailable;

  const valueForCurrent = (metric) => {
    if (cmp.isCustom) return valueFromBuckets(metric, customCurrentInfo);
    return current?.[metric.key];
  };
  const valueForCompare = (metric) => valueFromBuckets(metric, compareInfo);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Domain Authority"
      width="lg"
      footer={
        typeof onHistoryClick === 'function' ? (
          <div className="flex items-center justify-start gap-3">
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
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        <ComparePeriodSelector
          presetKey={cmp.presetKey}
          onPresetChange={cmp.setPresetKey}
          isCustom={cmp.isCustom}
        />

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
                {currentColLabel}  vs  {compareColLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Empty-state callout */}
        {!compareAvailable && compareColLabel !== '—' && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No data for {compareColLabel}. Use <strong>Edit</strong> → pick a past date to backfill any month in this range.</span>
          </div>
        )}
        {cmp.isCustom && !currentAvailable && currentColLabel !== '—' && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No data for {currentColLabel}. Use <strong>Edit</strong> → pick a past date to backfill any month in this range.</span>
          </div>
        )}

        {/* Comparison table — metric rows */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCurrentRange} onChange={cmp.setCustomCurrentRange} align="left" />
                    : 'This Month'}
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCompareRange} onChange={cmp.setCustomCompareRange} />
                    : compareColLabel}
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => {
                const cur = valueForCurrent(m);
                const prev = valueForCompare(m);
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
                      {currentAvailable ? fmtNumber(cur) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                      {compareAvailable ? fmtNumber(prev) : '—'}
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
