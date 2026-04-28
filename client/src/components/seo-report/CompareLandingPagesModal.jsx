import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Drawer from '../common/Drawer';
import Button from '../common/Button';
import DateRangePicker from '../common/DateRangePicker';
import Spinner from '../common/Spinner';
import { useAnalyticsInsights } from '../../hooks/useAnalytics';

const PRESETS = [
  { key: '1m',  label: 'Last 1 mo',  months: 1 },
  { key: '3m',  label: 'Last 3 mo',  months: 3 },
  { key: '6m',  label: 'Last 6 mo',  months: 6 },
  { key: '12m', label: 'Last 12 mo', months: 12 },
  { key: 'custom', label: 'Custom' },
];

function fmtNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function rangeLabel(start, end) {
  if (!start || !end) return '';
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) return format(start, 'MMM yyyy');
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`
    : `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
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

export default function CompareLandingPagesModal({ isOpen, onClose, siteId, currentPages = [], currentLabel = 'Current Period' }) {
  const [presetKey, setPresetKey] = useState('1m');
  const [customRange, setCustomRange] = useState(() => {
    const lastMonth = subMonths(new Date(), 1);
    return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPresetKey('1m');
    setShowAll(false);
    const lastMonth = subMonths(new Date(), 1);
    setCustomRange([startOfMonth(lastMonth), endOfMonth(lastMonth)]);
  }, [isOpen]);

  const [compareStart, compareEnd] = useMemo(() => {
    if (presetKey === 'custom') return customRange;
    const preset = PRESETS.find((p) => p.key === presetKey);
    const months = preset?.months || 1;
    const end = endOfMonth(subMonths(new Date(), 1));
    const start = startOfMonth(subMonths(new Date(), months));
    return [start, end];
  }, [presetKey, customRange]);

  const compareDateRange = useMemo(() => {
    if (!compareStart || !compareEnd) return null;
    return {
      from: format(compareStart, 'yyyy-MM-dd'),
      to: format(compareEnd, 'yyyy-MM-dd'),
    };
  }, [compareStart, compareEnd]);

  const enabled = isOpen && !!siteId && !!compareDateRange;
  const { insights: compareInsights, isLoading, error } = useAnalyticsInsights(
    enabled ? siteId : null,
    'custom',
    compareDateRange,
  );

  const comparePages = compareInsights?.landingPages || [];
  const headerLabel = useMemo(() => rangeLabel(compareStart, compareEnd), [compareStart, compareEnd]);
  const available = !isLoading && !error && Array.isArray(compareInsights?.landingPages);

  // Merge by page path. Compare sessions + conversions only (rates aren't summable across periods).
  const merged = useMemo(() => {
    const byPath = new Map();
    for (const p of currentPages) {
      byPath.set(p.page, {
        name: p.page,
        currentSessions: p.sessions || 0,
        currentConversions: p.conversions || 0,
        previousSessions: 0,
        previousConversions: 0,
      });
    }
    for (const p of comparePages) {
      const row = byPath.get(p.page) || {
        name: p.page,
        currentSessions: 0,
        currentConversions: 0,
        previousSessions: 0,
        previousConversions: 0,
      };
      row.previousSessions = p.sessions || 0;
      row.previousConversions = p.conversions || 0;
      byPath.set(p.page, row);
    }
    const arr = [...byPath.values()];
    arr.sort((a, b) => Math.max(b.currentSessions, b.previousSessions) - Math.max(a.currentSessions, a.previousSessions));
    return arr;
  }, [currentPages, comparePages]);

  const totalCurrentSessions = useMemo(() => currentPages.reduce((s, p) => s + (p.sessions || 0), 0), [currentPages]);
  const totalCompareSessions = useMemo(() => comparePages.reduce((s, p) => s + (p.sessions || 0), 0), [comparePages]);
  const totalCurrentConv = useMemo(() => currentPages.reduce((s, p) => s + (p.conversions || 0), 0), [currentPages]);
  const totalCompareConv = useMemo(() => comparePages.reduce((s, p) => s + (p.conversions || 0), 0), [comparePages]);

  const visibleRows = showAll ? merged : merged.slice(0, 20);
  const hasMore = merged.length > 20;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Organic Landing Pages"
      width="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
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
                placeholderStart="Start date"
                placeholderEnd="End date"
              />
            </div>
          )}
        </div>

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
                {currentLabel}  vs  {headerLabel || '—'}
              </div>
            </div>
          </div>
          {isLoading && <Spinner size="sm" />}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Sessions</div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <div>
                <div className="text-lg font-bold tabular-nums text-brand-on-surface dark:text-white font-headline">{fmtNumber(totalCurrentSessions)}</div>
                <div className="text-[10px] text-brand-outline font-label">{currentLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline">{available ? fmtNumber(totalCompareSessions) : (isLoading ? '…' : '—')}</div>
                <div className="text-[10px] text-brand-outline font-label truncate max-w-[120px]">{headerLabel || '—'}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-brand-outline-variant/60 dark:border-brand-outline/60 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Δ</span>
              <DeltaCell current={totalCurrentSessions} previous={totalCompareSessions} available={available} />
            </div>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Conversions</div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <div>
                <div className="text-lg font-bold tabular-nums text-brand-on-surface dark:text-white font-headline">{fmtNumber(totalCurrentConv)}</div>
                <div className="text-[10px] text-brand-outline font-label">{currentLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline">{available ? fmtNumber(totalCompareConv) : (isLoading ? '…' : '—')}</div>
                <div className="text-[10px] text-brand-outline font-label truncate max-w-[120px]">{headerLabel || '—'}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-brand-outline-variant/60 dark:border-brand-outline/60 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-brand-outline font-label">Δ</span>
              <DeltaCell current={totalCurrentConv} previous={totalCompareConv} available={available} />
            </div>
          </div>
        </div>

        {/* Error */}
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
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline">No landing pages to compare.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                  <th rowSpan={2} className="text-left  py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label align-bottom">Page</th>
                  <th colSpan={3} className="text-center py-1 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label border-l border-brand-outline-variant/60 dark:border-brand-outline/60">Sessions</th>
                  <th colSpan={3} className="text-center py-1 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label border-l border-brand-outline-variant/60 dark:border-brand-outline/60">Conversions</th>
                </tr>
                <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50 border-t border-brand-outline-variant/60 dark:border-brand-outline/60">
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label whitespace-nowrap border-l border-brand-outline-variant/60 dark:border-brand-outline/60">{currentLabel}</th>
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label whitespace-nowrap">{headerLabel || '—'}</th>
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label">Δ</th>
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label whitespace-nowrap border-l border-brand-outline-variant/60 dark:border-brand-outline/60">{currentLabel}</th>
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label whitespace-nowrap">{headerLabel || '—'}</th>
                  <th className="text-right py-1.5 px-2 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[9px] uppercase tracking-wider font-label">Δ</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const onlyCurrent = available && row.previousSessions === 0 && row.currentSessions > 0;
                  const onlyPrevious = available && row.currentSessions === 0 && row.previousSessions > 0;
                  return (
                    <tr key={row.name} className={`${i > 0 ? 'border-t border-gray-50 dark:border-brand-outline' : ''} hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors`}>
                      <td className="py-2.5 px-3 max-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[12px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label truncate" title={row.name}>
                            {row.name}
                          </span>
                          {onlyCurrent && <TagPill tone="gain" label="New" />}
                          {onlyPrevious && <TagPill tone="loss" label="Lost" />}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center text-[13px] font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap border-l border-brand-outline-variant/60 dark:border-brand-outline/60">{fmtNumber(row.currentSessions)}</td>
                      <td className="py-2 px-2 text-center text-[13px] font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{available ? fmtNumber(row.previousSessions) : (isLoading ? '…' : '—')}</td>
                      <td className="py-2 px-2 text-center whitespace-nowrap"><DeltaCell current={row.currentSessions} previous={row.previousSessions} available={available} /></td>
                      <td className="py-2 px-2 text-center text-[13px] font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap border-l border-brand-outline-variant/60 dark:border-brand-outline/60">{fmtNumber(row.currentConversions)}</td>
                      <td className="py-2 px-2 text-center text-[13px] font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{available ? fmtNumber(row.previousConversions) : (isLoading ? '…' : '—')}</td>
                      <td className="py-2 px-2 text-center whitespace-nowrap"><DeltaCell current={row.currentConversions} previous={row.previousConversions} available={available} /></td>
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
