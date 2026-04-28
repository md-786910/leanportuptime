import { useState, useEffect } from 'react';
import { computeDateRange } from '../common/SectionDateFilter';
import { useSeoReportStore } from '../../store/seoReportStore';
import Card from '../common/Card';
import BentoCard from '../common/BentoCard';
import { Sk } from '../common/Skeleton';
import { useAnalyticsStatus, useWebsiteAnalytics, useAnalyticsFilters } from '../../hooks/useAnalytics';
import ChannelBreakdownChart from './ChannelBreakdownChart';
import TopPagesVisitedTable from './TopPagesVisitedTable';
import GA4EventsPanel from './GA4EventsPanel';
import CompareWebsiteAnalyticsModal from './CompareWebsiteAnalyticsModal';

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Form-completion events across GA4 default + WPForms / Contact Form 7. Mirrors
// the Charts tab so both tabs show the same number. `form_start` is excluded
// because it's funnel intent, not a submission.
const FORM_SUBMIT_EVENTS = new Set([
  'generate_lead',
  'form_submit',
  'form_submission',
  'contact_form',
  'contact_form_submit',
  'wpforms_submit',
]);

function sumEventUsersByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.totalUsers || 0) : sum),
    0
  );
}

function KpiCard({ label, value, subtitle, accent }) {
  return (
    <div className="relative rounded-xl bg-white dark:bg-brand-surface-container-lowest border border-brand-outline-variant/70 dark:border-brand-outline/60 px-4 pt-4 pb-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-brand-outline-variant dark:hover:border-brand-outline transition-all overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-[1px] ${accent.bar}`} />
      <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.18em] mb-1.5">
        {label}
      </p>
      <p className="text-[26px] font-headline font-extrabold text-brand-on-surface dark:text-white tabular-nums leading-none mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-[10.5px] text-brand-outline dark:text-brand-on-surface-variant font-medium font-label leading-tight">{subtitle}</p>
      )}
    </div>
  );
}

const KPI_ACCENTS = [
  { bar: 'bg-[#6366F1] dark:bg-[#818CF8]' }, // refined indigo
  { bar: 'bg-[#0EA5E9] dark:bg-[#38BDF8]' }, // premium sky blue
  { bar: 'bg-[#10B981] dark:bg-[#34D399]' }, // elegant emerald
  { bar: 'bg-[#F59E0B] dark:bg-[#FBBF24]' }, // warm gold (better than amber)
  { bar: 'bg-[#F43F5E] dark:bg-[#FB7185]' }, // modern rose/red
  { bar: 'bg-[#8B5CF6] dark:bg-[#A78BFA]' }, // soft violet
];

function WebsiteDashboard({ siteId, themeKey, viewMode, analyticsStatus }) {
  const period = useSeoReportStore((s) => s.period);
  const customFrom = useSeoReportStore((s) => s.customFrom);
  const customTo = useSeoReportStore((s) => s.customTo);
  const dateRange = computeDateRange(period, customFrom, customTo);
  const { data, isLoading, isFetching, error } = useWebsiteAnalytics(siteId, period, dateRange);

  const filters = analyticsStatus?.filters || { excludedCountries: [], excludedTopPages: [] };
  const filtersMutation = useAnalyticsFilters(siteId);
  const [pendingScope, setPendingScope] = useState(null);

  const refreshing = filtersMutation.isPending || (isFetching && !isLoading);
  useEffect(() => { if (!refreshing) setPendingScope(null); }, [refreshing]);

  const channelsRefreshing = pendingScope === 'channels' && refreshing;
  const pagesRefreshing = pendingScope === 'pages' && refreshing;
  const [compareOpen, setCompareOpen] = useState(false);

  const setExcludedCountries = (excludedCountries) => {
    setPendingScope('channels');
    filtersMutation.mutate({ excludedCountries });
  };
  const excludePage = (page) => {
    setPendingScope('pages');
    filtersMutation.mutate({ excludedTopPages: [...(filters.excludedTopPages || []), page] });
  };
  const restorePage = (page) => {
    setPendingScope('pages');
    filtersMutation.mutate({ excludedTopPages: (filters.excludedTopPages || []).filter((p) => p !== page) });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BentoCard>
          <Sk className="h-4 w-20 mb-5 rounded-full" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-4 flex flex-col gap-3">
                <Sk className="h-2.5 w-14 rounded-full" />
                <Sk className="h-6 w-20" />
              </div>
            ))}
          </div>
        </BentoCard>
        <div className="grid grid-cols-12 gap-6">
          <BentoCard className="col-span-12 lg:col-span-8">
            <Sk className="h-4 w-32 mb-4 rounded-full" />
            <div className="rounded-lg border border-brand-outline-variant dark:border-brand-outline overflow-hidden">
              <div className="bg-brand-surface-container-low dark:bg-brand-on-surface/50 px-3 py-2.5 flex gap-6">
                <Sk className="h-2.5 w-6 rounded-full" />
                <Sk className="h-2.5 w-24 rounded-full" />
                <Sk className="h-2.5 w-12 rounded-full ml-auto" />
              </div>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-50 dark:border-brand-outline px-3 py-2.5 flex gap-6">
                  <Sk className="h-2.5 w-4 rounded-full" />
                  <Sk className="h-2.5 w-28 rounded-full" />
                  <Sk className="h-2.5 w-10 rounded-full ml-auto" />
                </div>
              ))}
            </div>
          </BentoCard>
          <BentoCard className="col-span-12 lg:col-span-4">
            <Sk className="h-48 w-full rounded-xl" />
          </BentoCard>
        </div>
        <BentoCard><Sk className="h-48 w-full rounded-xl" /></BentoCard>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm text-red-500 dark:text-red-400">
            {error.response?.data?.error?.message || 'Failed to load website analytics'}
          </p>
        </div>
      </Card>
    );
  }

  const overview = data?.overview || {};
  const details = data?.details || {};
  const events = details.events || {};
  const fileDownloadUsers = sumEventUsersByName(events.allEvents, (n) => n === 'file_download');
  const formSubmitUsers = sumEventUsersByName(events.allEvents, (n) => FORM_SUBMIT_EVENTS.has(n));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <BentoCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium font-label uppercase">
              All Traffic
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-xs font-medium px-2 py-1 rounded-md border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label self-start sm:self-auto"
            title="Compare against a past period"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Total Users" value={formatNumber(overview.uniqueVisitors)} accent={KPI_ACCENTS[0]} />
          <KpiCard label="New Users" value={formatNumber(overview.newUsers)} accent={KPI_ACCENTS[1]} />
          <KpiCard label="Bounce Rate" value={overview.bounceRate != null ? `${(overview.bounceRate * 100).toFixed(1)}%` : '—'} accent={KPI_ACCENTS[2]} />
          <KpiCard label="Avg. Time" value={formatDuration(overview.avgTimeOnPage)} accent={KPI_ACCENTS[3]} />
          <KpiCard label="File Downloads" value={formatNumber(fileDownloadUsers)} subtitle="Users who downloaded a file" accent={KPI_ACCENTS[4]} />
          <KpiCard label="Form Submitted" value={formatNumber(formSubmitUsers)} subtitle="Users who completed a form" accent={KPI_ACCENTS[5]} />
        </div>
      </BentoCard>

      {/* GA4 events — full width (table reads better wide) */}
      <BentoCard>
        <GA4EventsPanel events={events.allEvents || []} themeKey={themeKey} />
      </BentoCard>

      {/* Channel breakdown + Top pages — side-by-side 2-col grid */}
      {viewMode !== 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BentoCard>
            <ChannelBreakdownChart
              channels={details.channels}
              themeKey={themeKey}
              siteId={siteId}
              dateRange={dateRange}
              excludedCountries={filters.excludedCountries || []}
              onExcludedCountriesChange={setExcludedCountries}
              isRefreshing={channelsRefreshing}
            />
          </BentoCard>
          <BentoCard>
            <TopPagesVisitedTable
              pages={details.topPages}
              themeKey={themeKey}
              excludedPages={filters.excludedTopPages || []}
              onExclude={excludePage}
              onRestore={restorePage}
              isRefreshing={pagesRefreshing}
            />
          </BentoCard>
        </div>
      ) : (
        <BentoCard>
          <ChannelBreakdownChart
            channels={details.channels}
            themeKey={themeKey}
            siteId={siteId}
            dateRange={dateRange}
            excludedCountries={filters.excludedCountries || []}
            onExcludedCountriesChange={setExcludedCountries}
            isRefreshing={channelsRefreshing}
          />
        </BentoCard>
      )}

      <CompareWebsiteAnalyticsModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        siteId={siteId}
        currentData={data}
        currentLabel="Current Period"
      />
    </div>
  );
}

export default function WebsiteAnalyticsSection({ siteId, themeKey, viewMode }) {
  const { analyticsStatus, isLoading } = useAnalyticsStatus(siteId);

  // Don't show anything while loading or if GA4 is not linked
  // (user connects GA4 via the AnalyticsSection below)
  if (isLoading || !analyticsStatus?.linked) {
    return null;
  }

  return <WebsiteDashboard siteId={siteId} themeKey={themeKey} viewMode={viewMode} analyticsStatus={analyticsStatus} />;
}
