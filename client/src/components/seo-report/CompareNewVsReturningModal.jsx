import Drawer from '../common/Drawer';
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

function fmtPercent(v) {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function DeltaCell({ current, previous, available, isRate }) {
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

function ratio(part, total) {
  if (!total) return null;
  return part / total;
}

export default function CompareNewVsReturningModal({ isOpen, onClose, siteId, currentNewUsers = 0, currentReturningUsers = 0, currentLabel = 'Current Period' }) {
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

  const currentColLabel = cmp.isCustom ? (cmp.currentLabelText || '—') : currentLabel;
  const compareColLabel = cmp.compareLabelText || '—';

  const isLoading = compareLoading || (cmp.isCustom && customCurrentLoading);
  const error = compareError || customCurrentError;

  const compareAvailable = !compareLoading && !compareError && !!compareOverview;
  const currentAvailable = cmp.isCustom
    ? (!customCurrentLoading && !customCurrentError && !!customCurrentOverview)
    : true;
  const available = compareAvailable && currentAvailable;

  // Resolve current values: prop-based for presets, fetched for custom.
  const effCurrentNew = cmp.isCustom ? (customCurrentOverview?.newUsers || 0) : currentNewUsers;
  const effCurrentReturning = cmp.isCustom ? (customCurrentOverview?.returningUsers || 0) : currentReturningUsers;

  const currentTotal = effCurrentNew + effCurrentReturning;
  const compareNew = compareOverview?.newUsers || 0;
  const compareReturning = compareOverview?.returningUsers || 0;
  const compareTotal = compareNew + compareReturning;

  const currentNewPct = ratio(effCurrentNew, currentTotal);
  const compareNewPct = ratio(compareNew, compareTotal);
  const currentReturningPct = ratio(effCurrentReturning, currentTotal);
  const compareReturningPct = ratio(compareReturning, compareTotal);

  const showCurrentDash = cmp.isCustom && !currentAvailable;
  const fmtCurrent = (val, formatter = fmtNumber) => (showCurrentDash ? (customCurrentLoading ? '…' : '—') : formatter(val));
  const fmtCompare = (val, formatter = fmtNumber) => (compareAvailable ? formatter(val) : (compareLoading ? '…' : '—'));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare New vs Returning"
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
          {isLoading && <Spinner size="sm" />}
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

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
                <th className="text-left  py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">Metric</th>
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
              <tr className="hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">New Users</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">First-time visitors</div>
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(effCurrentNew)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(compareNew)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap"><DeltaCell current={effCurrentNew} previous={compareNew} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Returning Users</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Repeat visitors</div>
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(effCurrentReturning)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(compareReturning)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap"><DeltaCell current={effCurrentReturning} previous={compareReturning} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">Total Users</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">New + returning</div>
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(currentTotal)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(compareTotal)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap"><DeltaCell current={currentTotal} previous={compareTotal} available={available} /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">% New</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Acquisition mix</div>
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(currentNewPct, fmtPercent)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(compareNewPct, fmtPercent)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap"><DeltaCell current={currentNewPct} previous={compareNewPct} available={available} isRate /></td>
              </tr>
              <tr className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-[13px] font-medium text-brand-on-surface dark:text-brand-outline-variant font-label leading-tight">% Returning</div>
                  <div className="text-[10px] text-brand-outline font-label mt-0.5">Loyalty mix</div>
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">{fmtCurrent(currentReturningPct, fmtPercent)}</td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">{fmtCompare(compareReturningPct, fmtPercent)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap"><DeltaCell current={currentReturningPct} previous={compareReturningPct} available={available} isRate /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Drawer>
  );
}
