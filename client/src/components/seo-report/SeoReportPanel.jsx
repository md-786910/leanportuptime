import { useState } from 'react';
import { useSeoAudit, usePageSpeedFetch, useSeoHistory } from '../../hooks/useSeo';
import { useSeoReportStore } from '../../store/seoReportStore';
import SectionDateFilter from '../common/SectionDateFilter';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import ScoreGaugesRow from './ScoreGaugesRow';
import MetricsSection from './MetricsSection';
import ScoreTrendChart from './ScoreTrendChart';
import ColorPalettePicker from './ColorPalettePicker';
import StrategyToggle from './StrategyToggle';
import ViewModeToggle from './ViewModeToggle';
import SearchConsoleSection from './SearchConsoleSection';
import AnalyticsSection from './AnalyticsSection';
import WebsiteAnalyticsSection from './WebsiteAnalyticsSection';
import ChartsDashboard from './ChartsDashboard';
import GenerateReportButton from './GenerateReportButton';
import ReportSection from './ReportSection';
import BacklinksSection from './BacklinksSection';
import KeywordRankingsSection from './KeywordRankingsSection';
import BentoCard from '../common/BentoCard';
import { GaugeIcon, SearchIcon, AnalyticsIcon, LinkIcon } from './chartIcons';

const GLOBAL_PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: '2m', label: '2 months' },
  { key: 'custom', label: 'Custom' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SeoReportPanel({ siteId, siteName, siteUrl }) {
  const { audit, isLoading } = useSeoAudit(siteId);
  const { history, isLoading: historyLoading } = useSeoHistory(siteId);
  const pageSpeedMutation = usePageSpeedFetch(siteId);
  const colorTheme = useSeoReportStore((s) => s.colorTheme);
  const viewMode = useSeoReportStore((s) => s.viewMode);
  const period = useSeoReportStore((s) => s.period);
  const customFrom = useSeoReportStore((s) => s.customFrom);
  const customTo = useSeoReportStore((s) => s.customTo);
  const setPeriod = useSeoReportStore((s) => s.setPeriod);
  const setCustomFrom = useSeoReportStore((s) => s.setCustomFrom);
  const setCustomTo = useSeoReportStore((s) => s.setCustomTo);

  const [activeStrategy, setActiveStrategy] = useState('mobile');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasPageSpeed = audit?.pageSpeed && (audit.pageSpeed.mobile || audit.pageSpeed.desktop);
  const scores = hasPageSpeed
    ? audit.pageSpeed[activeStrategy] || audit.pageSpeed.mobile || audit.pageSpeed.desktop
    : null;

  // Empty state — no PageSpeed data at all
  if (!hasPageSpeed) {
    return (
      <div className="space-y-8">
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface-container-high dark:bg-brand-on-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-1">
              No PageSpeed Data Yet
            </h3>
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline mb-5 max-w-sm mx-auto">
              Fetch Google PageSpeed Insights to see performance scores, core web vitals, and optimization recommendations.
            </p>
            {audit?.pageSpeedError && (
              <p className="text-xs text-red-500 dark:text-red-400 mb-4  max-w-lg mx-auto font-label">
                {audit.pageSpeedError}
              </p>
            )}
            <Button
              onClick={() => pageSpeedMutation.mutate()}
              disabled={pageSpeedMutation.isPending}
              isLoading={pageSpeedMutation.isPending}
            >
              {pageSpeedMutation.isPending ? 'Fetching PageSpeed Data...' : 'Fetch PageSpeed Data'}
            </Button>
          </div>
        </Card>

        {/* Global date filter */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline font-label">Date Range</span>
            <SectionDateFilter
              periods={GLOBAL_PERIODS}
              period={period} setPeriod={setPeriod}
              customFrom={customFrom} setCustomFrom={setCustomFrom}
              customTo={customTo} setCustomTo={setCustomTo}
            />
          </div>
        </Card>

        {/* Organic search performance — GSC + GA4 Organic */}
        <ReportSection
          title="Search Performance"
          description="Organic search visibility — impressions, clicks, and queries from Google, combined with engagement and conversions from organic sessions."
          accent="blue"
          icon={SearchIcon}
        >
          <SearchConsoleSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          <AnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
        </ReportSection>

        {/* Off-page authority — Domain Authority */}
        <ReportSection
          title="Domain Authority"
          description="A single trust score summarising your site's overall link authority — higher means stronger off-page reputation."
          accent="amber"
          icon={LinkIcon}
        >
          <Card>
            <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} variant="domain-authority" />
          </Card>
        </ReportSection>

        {/* Backlinks — volume, growth, and raw list */}
        <ReportSection
          title="Backlinks Analysis"
          description="Total inbound links, unique referring domains, and links gained or lost in the selected window."
          accent="amber"
          icon={LinkIcon}
        >
          <Card>
            <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} variant="backlinks" />
          </Card>
        </ReportSection>

        {/* All-site traffic — GA4 all sources */}
        <ReportSection
          title="Website Traffic"
          description="All-traffic analytics from GA4 — sessions, users, events, and channels across every source."
          accent="emerald"
          icon={AnalyticsIcon}
        >
          <WebsiteAnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
        </ReportSection>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sticky band: header + view-mode controls */}
      <div className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 -mt-6 md:-mt-10 pt-6 md:pt-10 pb-3 bg-[#f8f9f9] dark:bg-brand-on-surface space-y-3">
        <Card className="shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-brand-on-surface dark:text-brand-outline-variant">SEO Report</h1>
              {audit?.scannedAt && (
                <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-0.5 font-label">
                  Last scan: {formatDate(audit.scannedAt)}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <ColorPalettePicker />
              <div className="w-px h-5 bg-brand-outline-variant dark:bg-brand-outline hidden sm:block" />
              <SectionDateFilter
                periods={GLOBAL_PERIODS}
                period={period} setPeriod={setPeriod}
                customFrom={customFrom} setCustomFrom={setCustomFrom}
                customTo={customTo} setCustomTo={setCustomTo}
              />
            </div>
          </div>
        </Card>

        {/* View mode toggle + Generate Report */}
        <div className="flex items-center justify-between">
          <ViewModeToggle />
          <GenerateReportButton siteId={siteId} siteName={siteName} siteUrl={siteUrl} scores={scores} strategy={activeStrategy} history={history} />
        </div>
      </div>

      {viewMode === 'charts' ? (
        <ChartsDashboard siteId={siteId} themeKey={colorTheme} scores={scores} strategy={activeStrategy} history={history} historyLoading={historyLoading} />
      ) : (
        <>
          {/* All-site traffic — GA4 all sources */}
          <ReportSection
            title="Website Traffic"
            description="All-traffic analytics from GA4 — sessions, users, events, and channels across every source."
            accent="emerald"
            icon={AnalyticsIcon}
          >
            <WebsiteAnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          </ReportSection>

          {/* Search Performance — disabled */}
          {/*
          <ReportSection
            title="Search Performance"
            description="Organic search visibility — impressions, clicks, and queries from Google, combined with engagement and conversions from organic sessions."
            accent="blue"
            icon={SearchIcon}
          >
            <SearchConsoleSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
            <AnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          </ReportSection>
          */}

          {/* Organic Traffic — GA4 organic sessions, trend, and engagement */}
          <ReportSection
            title="Organic Traffic"
            description="GA4 organic-search acquisition — sessions, engagement, and audience breakdown."
            accent="emerald"
            icon={AnalyticsIcon}
          >
            <AnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          </ReportSection>

          {/* Off-page authority — Domain Authority */}
          <ReportSection
            title="Domain Authority"
            description="Trust score, total backlinks, referring domains, and link gains or losses in the selected window."
            accent="amber"
            icon={LinkIcon}
          >
            <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} variant="domain-authority" />
          </ReportSection>

          {/* Backlinks — volume, growth, and raw list */}
          <ReportSection
            title="Backlinks Analysis"
            description="The list of external sources currently pointing at your site."
            accent="amber"
            icon={LinkIcon}
          >
            <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} variant="backlinks" />
          </ReportSection>

          {/* Keyword rankings — tracked queries */}
          <ReportSection
            title="Keyword Rankings"
            description="Positions, movement, and visibility for the keywords you're actively tracking."
            accent="amber"
            icon={LinkIcon}
          >
            <KeywordRankingsSection siteId={siteId} themeKey={colorTheme} />
          </ReportSection>

          {/* Site Performance — Lighthouse */}
          <ReportSection
            title="Site Performance"
            description="Lighthouse audit results for speed, Core Web Vitals, and SEO health."
            accent="violet"
            icon={GaugeIcon}
            actions={
              <>
                <StrategyToggle
                  strategy={activeStrategy}
                  onChange={setActiveStrategy}
                  hasMobile={!!audit.pageSpeed.mobile}
                  hasDesktop={!!audit.pageSpeed.desktop}
                />
                <button
                  onClick={() => pageSpeedMutation.mutate()}
                  disabled={pageSpeedMutation.isPending}
                  title="Refresh PageSpeed data"
                  className="p-2 rounded-lg text-brand-outline hover:text-brand-on-surface-variant dark:hover:text-brand-outline hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${pageSpeedMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </>
            }
          >
            <BentoCard>
              <ScoreGaugesRow scores={scores} themeKey={colorTheme} />
            </BentoCard>

            <div className="grid grid-cols-12 gap-6">
              <BentoCard className="col-span-12 lg:col-span-8">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <ScoreTrendChart
                    history={history}
                    themeKey={colorTheme}
                    strategy={activeStrategy}
                  />
                )}
              </BentoCard>

              <BentoCard className="col-span-12 lg:col-span-4">
                <MetricsSection scores={scores} themeKey={colorTheme} viewMode={viewMode} />
              </BentoCard>
            </div>
          </ReportSection>
        </>
      )}
    </div>
  );
}
