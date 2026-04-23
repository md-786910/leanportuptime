import { useState } from 'react';
import { useSeoAudit, usePageSpeedFetch, useSeoHistory } from '../../hooks/useSeo';
import { useSeoReportStore } from '../../store/seoReportStore';
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
import { GaugeIcon, SearchIcon, AnalyticsIcon, LinkIcon } from './chartIcons';

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

  const [activeStrategy, setActiveStrategy] = useState('mobile');
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);

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

        {/* Off-page authority — Domain Authority + Backlinks */}
        <ReportSection
          title="Off-Page SEO"
          description="Domain authority, backlinks, and referring domains — signals of your site's trust and reputation across the web."
          accent="amber"
          icon={LinkIcon}
        >
          <Card>
            <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} />
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
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-brand-on-surface dark:text-brand-outline-variant">SEO Report</h1>
            {audit?.scannedAt && (
              <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-0.5 font-label">
                Last scan: {formatDate(audit.scannedAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ColorPalettePicker />
            <div className="w-px h-6 bg-brand-surface-container-high dark:bg-brand-on-surface hidden sm:block" />
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
          </div>
        </div>
      </Card>

      {/* View mode toggle + Generate Report */}
      <div className="flex items-center justify-between">
        <ViewModeToggle />
        <GenerateReportButton siteId={siteId} siteName={siteName} siteUrl={siteUrl} scores={scores} strategy={activeStrategy} history={history} />
      </div>

      {viewMode === 'charts' ? (
        <ChartsDashboard siteId={siteId} themeKey={colorTheme} scores={scores} strategy={activeStrategy} history={history} historyLoading={historyLoading} />
      ) : (
        <>
          {/* Site Performance — Lighthouse */}
          <ReportSection
            title="Site Performance"
            description="Lighthouse audit results for speed, Core Web Vitals, and SEO health."
            accent="violet"
            icon={GaugeIcon}
          >
            <Card>
              <ScoreGaugesRow scores={scores} themeKey={colorTheme} />
            </Card>

            <Card>
              <MetricsSection scores={scores} themeKey={colorTheme} viewMode={viewMode} />
            </Card>

            <Card>
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
            </Card>
          </ReportSection>

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

          {/* Off-page authority — Domain Authority + Backlinks + tracked keyword rankings */}
          <ReportSection
            title="Off-Page SEO"
            description="Domain authority, backlinks, and tracked keyword rankings — signals of your site's trust and visibility across the web."
            accent="amber"
            icon={LinkIcon}
          >
            <Card>
              <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} />
              <div className="mt-6 pt-6 border-t border-brand-outline-variant dark:border-brand-outline">
                <button
                  type="button"
                  onClick={() => setKeywordsExpanded((v) => !v)}
                  className={`w-full flex items-center justify-between text-left ${keywordsExpanded ? 'mb-3 pb-2 border-b border-brand-outline-variant dark:border-brand-outline' : ''}`}
                  aria-expanded={keywordsExpanded}
                >
                  <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant uppercase tracking-wider font-label">
                    Keyword Rankings
                  </h3>
                  <svg
                    className={`w-4 h-4 text-brand-outline transition-transform ${keywordsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {keywordsExpanded && (
                  <KeywordRankingsSection siteId={siteId} themeKey={colorTheme} />
                )}
              </div>
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
        </>
      )}
    </div>
  );
}
