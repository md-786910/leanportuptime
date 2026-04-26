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
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasPageSpeed = audit?.pageSpeed && (audit.pageSpeed.mobile || audit.pageSpeed.desktop);
  const scores = hasPageSpeed
    ? audit.pageSpeed[activeStrategy] || audit.pageSpeed.mobile || audit.pageSpeed.desktop
    : null;

  if (!hasPageSpeed) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Card className="border-dashed border-2 bg-brand-primary/5">
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline mb-2">
              Performance Intelligence Required
            </h3>
            <p className="text-sm font-medium text-brand-outline mb-8 max-w-md mx-auto leading-relaxed">
              To generate a complete SEO intelligence report, we need to ingest Google PageSpeed technical metrics.
            </p>
            {audit?.pageSpeedError && (
              <div className="bg-red-500/5 text-red-500 text-xs font-bold p-4 rounded-2xl mb-8 max-w-lg mx-auto border border-red-500/10 font-mono">
                {audit.pageSpeedError}
              </div>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={() => pageSpeedMutation.mutate()}
              isLoading={pageSpeedMutation.isPending}
              className="shadow-brand-primary/30 min-w-[200px]"
            >
              Fetch Technical Vitals
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-8 opacity-50 grayscale pointer-events-none select-none">
          <ReportSection title="Search Visibility Analysis" accent="blue" icon={SearchIcon}>
            <div className="h-64 bg-brand-surface-container-low rounded-3xl" />
          </ReportSection>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-brand-surface-container-low/30 rounded-3xl p-6 border border-brand-outline-variant/30 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-brand-primary/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">Enterprise SEO intelligence</h1>
              {audit?.scannedAt && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-bold text-brand-outline uppercase tracking-[0.2em] font-label">
                    Last computed: {formatDate(audit.scannedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 p-1.5 bg-brand-surface-container-lowest/50 rounded-2xl border border-brand-outline-variant/20">
              <ColorPalettePicker />
              <div className="w-px h-6 bg-brand-outline-variant/20 mx-1" />
              <StrategyToggle
                strategy={activeStrategy}
                onChange={setActiveStrategy}
                hasMobile={!!audit.pageSpeed.mobile}
                hasDesktop={!!audit.pageSpeed.desktop}
              />
            </div>
            <button
              onClick={() => pageSpeedMutation.mutate()}
              disabled={pageSpeedMutation.isPending}
              className="p-2.5 rounded-xl bg-brand-surface-container-lowest border border-brand-outline-variant/30 text-brand-outline hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${pageSpeedMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <ViewModeToggle />
        <GenerateReportButton 
          siteId={siteId} 
          siteName={siteName} 
          siteUrl={siteUrl} 
          scores={scores} 
          strategy={activeStrategy} 
          history={history} 
          className="shadow-xl"
        />
      </div>

      {viewMode === 'charts' ? (
        <ChartsDashboard siteId={siteId} themeKey={colorTheme} scores={scores} strategy={activeStrategy} history={history} historyLoading={historyLoading} />
      ) : (
        <div className="space-y-12">
          <ReportSection
            title="Technical Excellence"
            description="Deep technical audit of rendering performance, visual stability, and standard SEO compliance markers."
            accent="violet"
            icon={GaugeIcon}
          >
            <Card padding="none" className="overflow-hidden border-brand-outline-variant/20 shadow-xl shadow-brand-primary/5">
              <div className="p-8">
                <ScoreGaugesRow scores={scores} themeKey={colorTheme} />
              </div>
              <div className="bg-brand-surface-container-lowest/50 border-t border-brand-outline-variant/20 p-8">
                <MetricsSection scores={scores} themeKey={colorTheme} viewMode={viewMode} />
              </div>
            </Card>

            <Card className="border-brand-outline-variant/20 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-widest font-headline">Performance Velocity Trend</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-outline uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-brand-primary" />
                  Historical Index
                </div>
              </div>
              {historyLoading ? (
                <div className="flex justify-center py-20"><Spinner size="md" /></div>
              ) : (
                <ScoreTrendChart
                  history={history}
                  themeKey={colorTheme}
                  strategy={activeStrategy}
                />
              )}
            </Card>
          </ReportSection>

          <ReportSection
            title="Search Performance"
            description="Analysis of organic visibility and conversion efficiency from Google search results."
            accent="blue"
            icon={SearchIcon}
          >
            <SearchConsoleSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
            <AnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          </ReportSection>

          <ReportSection
            title="Authority & Market Share"
            description="Global trust signals, link equity distribution, and keyword positioning across target markets."
            accent="amber"
            icon={LinkIcon}
          >
            <Card className="border-brand-outline-variant/20 shadow-xl overflow-hidden">
              <BacklinksSection siteId={siteId} themeKey={colorTheme} showTitle={false} />
              <div className="mt-8 pt-8 border-t border-brand-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setKeywordsExpanded((v) => !v)}
                  className="w-full flex items-center justify-between p-4 bg-brand-surface-container-low/30 rounded-2xl border border-brand-outline-variant/30 hover:border-brand-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-surface-container-highest rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black text-brand-on-surface uppercase tracking-widest font-headline">Target Keyword Rankings</h3>
                  </div>
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${keywordsExpanded ? 'rotate-180 bg-brand-primary text-white' : 'bg-brand-surface-container-highest text-brand-outline'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {keywordsExpanded && (
                  <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <KeywordRankingsSection siteId={siteId} themeKey={colorTheme} />
                  </div>
                )}
              </div>
            </Card>
          </ReportSection>

          <ReportSection
            title="Engagement intelligence"
            description="Comprehensive behavior analysis across all acquisition channels and user segments."
            accent="emerald"
            icon={AnalyticsIcon}
          >
            <WebsiteAnalyticsSection siteId={siteId} themeKey={colorTheme} viewMode={viewMode} />
          </ReportSection>
        </div>
      )}
    </div>
  );
}
