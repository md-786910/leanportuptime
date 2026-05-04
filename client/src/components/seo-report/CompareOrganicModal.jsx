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
  const deltaDisplay = isRate ? `${(absDelta * 100).toFixed(1)}%` : fmtNumber(absDelta);

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

  const compareOverview = compareData?.overview || null;
  const customCurrentOverview = customCurrentData?.overview || null;
  const effectiveCurrentOverview = cmp.isCustom ? customCurrentOverview : currentOverview;

  const currentColLabel = cmp.isCustom ? (cmp.currentLabelText || '—') : currentLabel;
  const compareColLabel = cmp.compareLabelText || '—';

  const isLoading = compareLoading || (cmp.isCustom && customCurrentLoading);
  const error = compareError || customCurrentError;

  const compareAvailable = !compareLoading && !compareError && !!compareOverview;
  const currentAvailable = cmp.isCustom
    ? (!customCurrentLoading && !customCurrentError && !!customCurrentOverview)
    : !!effectiveCurrentOverview;
  const available = compareAvailable && currentAvailable;

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

        {/* Metric comparison table */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCurrentRange} onChange={cmp.setCustomCurrentRange} align="left" />
                    : currentLabel}
                </th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label whitespace-nowrap">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCompareRange} onChange={cmp.setCustomCompareRange} />
                    : compareColLabel}
                </th>
                <th className="text-center py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Δ</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => {
                const cur = m.getValue(effectiveCurrentOverview);
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
                      {currentAvailable ? m.format(cur) : (customCurrentLoading ? '…' : '—')}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                      {compareAvailable ? m.format(prev) : (compareLoading ? '…' : '—')}
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
