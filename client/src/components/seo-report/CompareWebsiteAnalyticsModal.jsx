import Drawer from '../common/Drawer';
import Spinner from '../common/Spinner';
import { useWebsiteAnalytics } from '../../hooks/useAnalytics';
import ComparePeriodSelector from './compare/ComparePeriodSelector';
import RangeHeaderButton from './compare/RangeHeaderButton';
import { useComparePeriods } from './compare/useComparePeriods';

const FORM_SUBMIT_EVENTS = new Set([
  'generate_lead',
  'form_submit',
  'form_submission',
  'contact_form',
  'contact_form_submit',
  'contact_form_submitted',
  'wpforms_submit',
]);

function sumEventUsersByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.totalUsers || 0) : sum),
    0
  );
}

function sumEventCountByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.eventCount || 0) : sum),
    0
  );
}

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
  { key: 'totalUsers',    label: 'Total Users',       hint: 'Distinct users',       lowerIsBetter: false, getValue: (d) => d?.overview?.uniqueVisitors,  format: fmtNumber },
  { key: 'newUsers',      label: 'New Users',         hint: 'First-time visitors',  lowerIsBetter: false, getValue: (d) => d?.overview?.newUsers,        format: fmtNumber },
  { key: 'bounceRate',    label: 'Bounce Rate',       hint: 'Lower is better',      lowerIsBetter: true,  getValue: (d) => d?.overview?.bounceRate,      format: fmtPercent, isRate: true },
  { key: 'avgTime',       label: 'Avg. Time on Page', hint: 'Per session',          lowerIsBetter: false, getValue: (d) => d?.overview?.avgTimeOnPage,   format: fmtDuration },
  { key: 'fileDownloads', label: 'File Downloads',    hint: 'Users who downloaded', lowerIsBetter: false, getValue: (d) => sumEventUsersByName(d?.details?.events?.allEvents, (n) => n === 'file_download'), format: fmtNumber },
  { key: 'formSubmitted', label: 'Form Submitted',    hint: 'Form submissions',     lowerIsBetter: false, getValue: (d) => sumEventCountByName(d?.details?.events?.allEvents, (n) => FORM_SUBMIT_EVENTS.has(n)), format: fmtNumber },
];

function DeltaCell({ current, previous, lowerIsBetter, available, isRate }) {
  if (!available || current == null || previous == null) {
    return <span className="text-[11px] text-brand-outline font-label">—</span>;
  }
  const cur = Number(current);
  const prev = Number(previous);
  const delta = cur - prev;
  if (delta === 0) {
    return <span className="text-[11px] text-brand-outline-variant font-label">No change</span>;
  }
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

export default function CompareWebsiteAnalyticsModal({ isOpen, onClose, siteId, currentData, currentLabel = 'Current' }) {
  const cmp = useComparePeriods({ isOpen });

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

  const effectiveCurrentData = cmp.isCustom ? customCurrentData : currentData;
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Website Traffic"
      width="lg"
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
          {(isLoading || isFetching) && <Spinner size="sm" />}
        </div>

        {/* Error / empty callout */}
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
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-[10px] uppercase tracking-wider font-label">
                  {cmp.isCustom
                    ? <RangeHeaderButton value={cmp.customCurrentRange} onChange={cmp.setCustomCurrentRange} align="left" />
                    : currentLabel}
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
                const cur = m.getValue(effectiveCurrentData);
                const prev = m.getValue(compareData);
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
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface dark:text-white font-headline whitespace-nowrap">
                      {currentAvailable ? m.format(cur) : (customCurrentLoading ? '…' : '—')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-brand-on-surface-variant dark:text-brand-outline font-headline whitespace-nowrap">
                      {compareAvailable ? m.format(prev) : (compareLoading ? '…' : '—')}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <DeltaCell current={cur} previous={prev} lowerIsBetter={m.lowerIsBetter} available={available} isRate={m.isRate} />
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
            <span>Pick a different preset, or use Custom to compare any two date ranges.</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
