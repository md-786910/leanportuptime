import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Drawer from '../common/Drawer';
import Button from '../common/Button';
import DateRangePicker from '../common/DateRangePicker';
import Spinner from '../common/Spinner';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';

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

function fmtDuration(seconds) {
  if (seconds == null || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtPercent(v) {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

const METRICS = [
  { key: 'sessions',           label: 'Organic Sessions',     hint: 'Distinct sessions',    lowerIsBetter: false, getValue: (o) => o?.sessions,           format: fmtNumber },
  { key: 'engagementRate',     label: 'Engagement Rate',      hint: 'Higher is better',     lowerIsBetter: false, getValue: (o) => o?.engagementRate,     format: fmtPercent, isRate: true },
  { key: 'avgEngagementTime',  label: 'Avg. Engagement Time', hint: 'Per session',          lowerIsBetter: false, getValue: (o) => o?.avgEngagementTime,  format: fmtDuration },
  { key: 'conversions',        label: 'Organic Conversions',  hint: 'Goal completions',     lowerIsBetter: false, getValue: (o) => o?.conversions,        format: fmtNumber },
  { key: 'newUsers',           label: 'New Users',            hint: 'First-time visitors',  lowerIsBetter: false, getValue: (o) => o?.newUsers,           format: fmtNumber },
  { key: 'returningUsers',     label: 'Returning Users',      hint: 'Repeat visitors',      lowerIsBetter: false, getValue: (o) => o?.returningUsers,     format: fmtNumber },
];

function rangeLabel(start, end) {
  if (!start || !end) return '';
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) return format(start, 'MMM yyyy');
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`
    : `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
}

function DeltaCell({ current, previous, lowerIsBetter, available, isRate }) {
  if (!available || current == null || previous == null) {
    return <span className="text-[11px] text-brand-outline font-label">—</span>;
  }
  const cur = Number(current);
  const prev = Number(previous);
  const delta = cur - prev;
  if (delta === 0) return <span className="text-[11px] text-brand-outline-variant font-label">No change</span>;

  const isUp = delta > 0;
  const positive = lowerIsBetter ? !isUp : isUp;
  const colorCls = positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const arrow = isUp ? '↑' : '↓';
  const sign = isUp ? '+' : '−';
  const absDelta = Math.abs(delta);
  const pct = prev === 0 ? null : Math.abs((delta / prev) * 100);
  const deltaDisplay = isRate ? `${(absDelta * 100).toFixed(1)}pp` : fmtNumber(absDelta);

  return (
    <div className={`flex flex-col items-end gap-0 leading-tight ${colorCls}`}>
      <span className="text-sm font-bold tabular-nums font-label">{sign}{deltaDisplay}</span>
      <span className="text-[10px] tabular-nums font-label opacity-90">
        {arrow} {pct == null ? '—' : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

export default function CompareOrganicModal({ isOpen, onClose, siteId, currentOverview, currentLabel = 'Current Period' }) {
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
  const { data: compareData, isLoading, error } = useAnalyticsOverview(
    enabled ? siteId : null,
    'custom',
    compareDateRange,
  );

  const compareOverview = compareData?.overview || null;
  const headerLabel = useMemo(() => rangeLabel(compareStart, compareEnd), [compareStart, compareEnd]);
  const available = !isLoading && !error && !!compareOverview;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Organic Search"
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

        {/* Error callout */}
        {error && (
          <div className="flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
            </svg>
            <span>{error?.response?.data?.error?.message || 'Failed to load comparison data.'}</span>
          </div>
        )}

        {/* Metric comparison table */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">{currentLabel}</th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">{headerLabel || '—'}</th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => {
                const cur = m.getValue(currentOverview);
                const prev = m.getValue(compareOverview);
                return (
                  <tr key={m.key} className={`${i > 0 ? 'border-t border-gray-50 dark:border-brand-outline' : ''} hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors`}>
                    <td className="py-2.5 px-3">
                      <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">
                        {m.label}
                      </div>
                      <div className="text-[10px] text-brand-outline font-label mt-0.5">
                        {m.hint}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">
                      {m.format(cur)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                      {available ? m.format(prev) : (isLoading ? '…' : '—')}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <DeltaCell current={cur} previous={prev} lowerIsBetter={m.lowerIsBetter} available={available} isRate={m.isRate} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Drawer>
  );
}
