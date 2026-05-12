import { useState, useEffect, useMemo } from 'react';
import Drawer from '../common/Drawer';
import Spinner from '../common/Spinner';
import { useWebsiteAnalytics } from '../../hooks/useAnalytics';
import ComparePeriodSelector from './compare/ComparePeriodSelector';
import RangeHeaderButton from './compare/RangeHeaderButton';
import { useComparePeriods } from './compare/useComparePeriods';

function fmtNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function DeltaCell({ current, previous, available }) {
  if (!available) return <span className="text-[11px] text-brand-outline font-label">—</span>;
  const cur = Number(current ?? 0);
  const prev = Number(previous ?? 0);
  const delta = cur - prev;
  if (cur === 0 && prev === 0) return <span className="text-[11px] text-brand-outline-variant font-label">—</span>;
  if (delta === 0) return <span className="text-[11px] text-brand-outline-variant font-label">No change</span>;

  const isUp = delta > 0;
  const colorCls = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const arrow = isUp ? '↑' : '↓';
  const sign = isUp ? '+' : '−';
  const absDelta = Math.abs(delta);
  const pct = prev === 0 ? null : Math.abs((delta / prev) * 100);

  return (
    <div className={`flex flex-col items-end gap-0 leading-tight ${colorCls}`}>
      <span className="text-sm font-bold tabular-nums font-label">{sign}{fmtNumber(absDelta)}</span>
      <span className="text-[10px] tabular-nums font-label opacity-90">
        {arrow} {pct == null ? 'new' : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

function TagPill({ tone = 'gain', label }) {
  const styles = tone === 'gain'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${styles} font-label`}>
      {label}
    </span>
  );
}

export default function ComparePagesModal({ isOpen, onClose, siteId, currentPages = [], currentLabel = 'Current Period' }) {
  const cmp = useComparePeriods({ isOpen });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowAll(false);
  }, [isOpen]);

  const compareEnabled = isOpen && !!siteId && !!cmp.compareDateRange;
  const { data: compareData, isLoading: compareLoading, isFetching: compareFetching, error: compareError } = useWebsiteAnalytics(
    compareEnabled ? siteId : null,
    'custom',
    cmp.compareDateRange,
  );

  const customCurrentEnabled = isOpen && !!siteId && cmp.isCustom && !!cmp.currentDateRange;
  const { data: customCurrentData, isLoading: customCurrentLoading, isFetching: customCurrentFetching, error: customCurrentError } = useWebsiteAnalytics(
    customCurrentEnabled ? siteId : null,
    'custom',
    cmp.currentDateRange,
  );

  const comparePages = compareData?.details?.topPages || [];
  const customCurrentPages = customCurrentData?.details?.topPages || [];
  const effectiveCurrentPages = cmp.isCustom ? customCurrentPages : currentPages;

  const currentColLabel = cmp.isCustom ? (cmp.currentLabelText || '—') : currentLabel;
  const compareColLabel = cmp.compareLabelText || '—';

  const isLoading = compareLoading || (cmp.isCustom && customCurrentLoading);
  const isFetching = compareFetching || (cmp.isCustom && customCurrentFetching);
  const error = compareError || customCurrentError;

  const compareAvailable = !compareLoading && !compareError && !!compareData;
  const currentAvailable = cmp.isCustom
    ? (!customCurrentLoading && !customCurrentError && !!customCurrentData)
    : true;
  const available = compareAvailable && currentAvailable;

  // Merge by page path.
  const merged = useMemo(() => {
    const byPath = new Map();
    for (const p of effectiveCurrentPages) {
      byPath.set(p.page, { name: p.page, current: p.pageViews || 0, previous: 0 });
    }
    for (const p of comparePages) {
      const row = byPath.get(p.page) || { name: p.page, current: 0, previous: 0 };
      row.previous = p.pageViews || 0;
      byPath.set(p.page, row);
    }
    const arr = [...byPath.values()];
    arr.sort((a, b) => Math.max(b.current, b.previous) - Math.max(a.current, a.previous));
    return arr;
  }, [effectiveCurrentPages, comparePages]);

  const totalCurrent = useMemo(
    () => effectiveCurrentPages.reduce((s, p) => s + (p.pageViews || 0), 0),
    [effectiveCurrentPages],
  );
  const totalCompare = useMemo(
    () => comparePages.reduce((s, p) => s + (p.pageViews || 0), 0),
    [comparePages],
  );

  const visibleRows = showAll ? merged : merged.slice(0, 20);
  const hasMore = merged.length > 20;

  const fmtCurrent = (val) => (currentAvailable ? fmtNumber(val) : (customCurrentLoading ? '…' : '—'));
  const fmtCompare = (val) => (compareAvailable ? fmtNumber(val) : (compareLoading ? '…' : '—'));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Top Pages"
      width="lg"
    >
      <div className="space-y-5">
        <ComparePeriodSelector
          presetKey={cmp.presetKey}
          onPresetChange={cmp.setPresetKey}
          isCustom={cmp.isCustom}
        />

        {/* Comparing chip */}
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
          {(isLoading || isFetching) && <Spinner size="sm" />}
        </div>

        {/* Total page views summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label truncate">{currentColLabel}</div>
            <div className="text-lg font-bold tabular-nums text-brand-on-surface dark:text-white font-headline">{fmtCurrent(totalCurrent)}</div>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label truncate">{compareColLabel}</div>
            <div className="text-lg font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline">{fmtCompare(totalCompare)}</div>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Δ Page Views</div>
            <DeltaCell current={totalCurrent} previous={totalCompare} available={available} />
          </div>
        </div>

        {/* Error callout */}
        {error && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
            </svg>
            <span>{error?.response?.data?.error?.message || 'Failed to load comparison data.'}</span>
          </div>
        )}

        {/* Per-page comparison table */}
        {merged.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-brand-outline-variant dark:border-brand-outline">
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline">No pages to compare.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                  <th className="text-left  py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Page</th>
                  <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                    {cmp.isCustom
                      ? <RangeHeaderButton value={cmp.customCurrentRange} onChange={cmp.setCustomCurrentRange} align="left" />
                      : currentLabel}
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                    {cmp.isCustom
                      ? <RangeHeaderButton value={cmp.customCompareRange} onChange={cmp.setCustomCompareRange} />
                      : compareColLabel}
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const onlyCurrent = available && row.previous === 0 && row.current > 0;
                  const onlyPrevious = available && row.current === 0 && row.previous > 0;
                  return (
                    <tr key={row.name} className={`${i > 0 ? 'border-t border-gray-50 dark:border-brand-outline' : ''} hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors`}>
                      <td className="py-2.5 px-3 max-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label truncate" title={row.name}>
                            {row.name}
                          </span>
                          {onlyCurrent && <TagPill tone="gain" label="New" />}
                          {onlyPrevious && <TagPill tone="loss" label="Lost" />}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">
                        {fmtCurrent(row.current)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                        {fmtCompare(row.previous)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <DeltaCell current={row.current} previous={row.previous} available={available} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-medium text-brand-primary dark:text-brand-400 hover:underline font-label"
            >
              {showAll ? 'Show top 20 only' : `Show all ${merged.length} pages`}
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
