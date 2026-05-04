import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Drawer from '../common/Drawer';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';
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
  const cmp = useComparePeriods({ isOpen });

  const compareEnabled = isOpen && !!siteId && !!cmp.compareDateRange;
  const { data: compareData, isLoading: compareLoading, error: compareError } = useAnalyticsOverview(
    compareEnabled ? siteId : null,
    'custom',
    cmp.compareDateRange,
  );

  const customCurrentEnabled = isOpen && !!siteId && cmp.isCustom && !!cmp.currentDateRange;
  const { data: customCurrentData, isLoading: customCurrentLoading, error: customCurrentError } = useAnalyticsOverview(
    customCurrentEnabled ? siteId : null,
    'custom',
    cmp.currentDateRange,
  );

  const compareTrend = compareData?.trend || [];
  const customCurrentTrend = customCurrentData?.trend || [];
  const effectiveCurrentTrend = cmp.isCustom ? customCurrentTrend : currentTrend;

  const currentColLabel = cmp.isCustom ? (cmp.currentLabelText || '—') : currentLabel;
  const compareColLabel = cmp.compareLabelText || '—';

  const isLoading = compareLoading || (cmp.isCustom && customCurrentLoading);
  const error = compareError || customCurrentError;

  const compareAvailable = !compareLoading && !compareError && Array.isArray(compareData?.trend);
  const currentAvailable = cmp.isCustom
    ? (!customCurrentLoading && !customCurrentError && Array.isArray(customCurrentData?.trend))
    : true;
  const available = compareAvailable && currentAvailable;

  const totalCurrentSessions = useMemo(() => sumTrend(effectiveCurrentTrend, 'sessions'), [effectiveCurrentTrend]);
  const totalCompareSessions = useMemo(() => sumTrend(compareTrend, 'sessions'), [compareTrend]);
  const totalCurrentConv = useMemo(() => sumTrend(effectiveCurrentTrend, 'conversions'), [effectiveCurrentTrend]);
  const totalCompareConv = useMemo(() => sumTrend(compareTrend, 'conversions'), [compareTrend]);
  const avgCurrentSessions = useMemo(() => avgTrend(effectiveCurrentTrend, 'sessions'), [effectiveCurrentTrend]);
  const avgCompareSessions = useMemo(() => avgTrend(compareTrend, 'sessions'), [compareTrend]);

  const aligned = useMemo(() => alignTrends(effectiveCurrentTrend, compareTrend), [effectiveCurrentTrend, compareTrend]);

  const fmtCurrent = (val) => (currentAvailable ? fmtNumber(val) : (customCurrentLoading ? '…' : '—'));
  const fmtCompare = (val) => (compareAvailable ? fmtNumber(val) : (compareLoading ? '…' : '—'));

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
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCurrentRange} onChange={cmp.setCustomCurrentRange} align="left" />
                    : currentLabel}
                </th>
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCompareRange} onChange={cmp.setCustomCompareRange} />
                    : compareColLabel}
                </th>
                <th className="text-right px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Total Sessions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Sum across range</div>
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(totalCurrentSessions)}</td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(totalCompareSessions)}</td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap"><DeltaCell current={totalCurrentSessions} previous={totalCompareSessions} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Total Conversions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Sum across range</div>
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(totalCurrentConv)}</td>
                <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(totalCompareConv)}</td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap"><DeltaCell current={totalCurrentConv} previous={totalCompareConv} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Avg. Daily Sessions</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Average per day</div>
                </td>
                <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(Math.round(avgCurrentSessions))}</td>
                <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(Math.round(avgCompareSessions))}</td>
                <td className="py-2 px-3 text-center whitespace-nowrap"><DeltaCell current={Math.round(avgCurrentSessions)} previous={Math.round(avgCompareSessions)} available={available} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Overlay chart — sessions current vs compare on aligned day index */}
        {(effectiveCurrentTrend.length > 1 || compareTrend.length > 1) && (
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
                  <Area type="monotone" dataKey="currentSessions" stroke="#6366F1" strokeWidth={2} fill="url(#cmpCur)" name={currentColLabel} />
                  <Area type="monotone" dataKey="compareSessions" stroke="#94A3B8" strokeWidth={2} fill="url(#cmpPrev)" name={compareColLabel || 'Compare'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
