import { uscentere, useEffect, useMemo, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
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
  if (!available || current == null || previous == null) {
    return <span className="text-[11px] text-brand-outline font-label">—</span>;
  }
  const cur = Number(current);
  const prev = Number(previous);
  const delta = cur - prev;
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
        {arrow} {pct == null ? '—' : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

function sumTrend(trend, key) {
  if (!Array.isArray(trend)) return 0;
  return trend.reduce((s, p) => s + (p[key] || 0), 0);
}

function avgTrend(trend, key) {
  if (!Array.isArray(trend) || trend.length === 0) return 0;
  return sumTrend(trend, key) / trend.length;
}

// Builds a normalized trend dataset where both periods share an x-axis (day index)
// from 1..N, allowing visual comparison of two periods of the same length.
function alignTrends(currentTrend, compareTrend) {
  const len = Math.max(currentTrend?.length || 0, compareTrend?.length || 0);
  const out = [];
  for (let i = 0; i < len; i += 1) {
    out.push({
      day: i + 1,
      currentSessions: currentTrend?.[i]?.sessions ?? null,
      compareSessions: compareTrend?.[i]?.sessions ?? null,
      currentConversions: currentTrend?.[i]?.conversions ?? null,
      compareConversions: compareTrend?.[i]?.conversions ?? null,
    });
  }
  return out;
}

export default function CompareOrganicTrendModal({ isOpen, onClose, siteId, currentTrend = [], currentLabel = 'Current Period' }) {
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

  const compareTrend = compareData?.trend || [];
  const headerLabel = useMemo(() => rangeLabel(compareStart, compareEnd), [compareStart, compareEnd]);
  const available = !isLoading && !error && Array.isArray(compareData?.trend);

  const totalCurrentSessions = useMemo(() => sumTrend(currentTrend, 'sessions'), [currentTrend]);
  const totalCompareSessions = useMemo(() => sumTrend(compareTrend, 'sessions'), [compareTrend]);
  const totalCurrentConv = useMemo(() => sumTrend(currentTrend, 'conversions'), [currentTrend]);
  const totalCompareConv = useMemo(() => sumTrend(compareTrend, 'conversions'), [compareTrend]);
  const avgCurrentSessions = useMemo(() => avgTrend(currentTrend, 'sessions'), [currentTrend]);
  const avgCompareSessions = useMemo(() => avgTrend(compareTrend, 'sessions'), [compareTrend]);

  const aligned = useMemo(() => alignTrends(currentTrend, compareTrend), [currentTrend, compareTrend]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Organic Traffic Trend"
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

        {/* Totals comparison table */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-left px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">{currentLabel}</th>
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">{headerLabel || '—'}</th>
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Total Sessions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Sum across range</div>
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtNumber(totalCurrentSessions)}</td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{available ? fmtNumber(totalCompareSessions) : (isLoading ? '…' : '—')}</td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap"><DeltaCell current={totalCurrentSessions} previous={totalCompareSessions} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Total Conversions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Sum across range</div>
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtNumber(totalCurrentConv)}</td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{available ? fmtNumber(totalCompareConv) : (isLoading ? '…' : '—')}</td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap"><DeltaCell current={totalCurrentConv} previous={totalCompareConv} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Avg. Daily Sessions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Average per day</div>
                </td>
                <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtNumber(Math.round(avgCurrentSessions))}</td>
                <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{available ? fmtNumber(Math.round(avgCompareSessions)) : (isLoading ? '…' : '—')}</td>
                <td className="py-2 px-3 text-center whitespace-nowrap"><DeltaCell current={Math.round(avgCurrentSessions)} previous={Math.round(avgCompareSessions)} available={available} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Overlay chart — sessions current vs compare on aligned day index */}
        {(currentTrend.length > 1 || compareTrend.length > 1) && (
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline-variant uppercase tracking-wider font-label">Sessions overlay</h5>
              <span className="text-[10px] text-brand-outline font-label">Day-by-day, aligned from start of each range</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aligned} margin={{ top: 5, right: 10, bottom: 5, left: -30 }}>
                  <defs>
                    <linearGradient id="cmpCur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cmpPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value, name) => [fmtNumber(value), name]}
                    labelFormatter={(d) => `Day ${d}`}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="currentSessions" stroke="#6366F1" strokeWidth={2} fill="url(#cmpCur)" name={currentLabel} />
                  <Area type="monotone" dataKey="compareSessions" stroke="#94A3B8" strokeWidth={2} fill="url(#cmpPrev)" name={headerLabel || 'Compare'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
