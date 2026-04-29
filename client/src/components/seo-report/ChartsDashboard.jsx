import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  AreaChart, Area, LineChart, Line, BarChart, Bar, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import Spinner from '../common/Spinner';
import { Sk } from '../common/Skeleton';
import { computeDateRange } from '../common/SectionDateFilter';
import { useSeoReportStore } from '../../store/seoReportStore';
import { themeColor } from './colorThemes';
import { useGscStatus, useGscPerformance, useGscInsights } from '../../hooks/useSearchConsole';
import { useAnalyticsStatus, useWebsiteAnalytics, useAnalyticsOverview, useAnalyticsInsights, useAnalyticsFilters } from '../../hooks/useAnalytics';
import { CountryFilterDropdown } from './ChannelBreakdownChart';
import TopQueriesTable from './TopQueriesTable';
import TopPagesTable from './TopPagesTable';
import TopPagesVisitedTable from './TopPagesVisitedTable';
import BacklinksSection from './BacklinksSection';
import TopKeywordsPanel from './TopKeywordsPanel';
import ReportSection from './ReportSection';
import NewVsReturningChart from './NewVsReturningChart';
import { GaugeIcon, SearchIcon, AnalyticsIcon, LinkIcon } from './chartIcons';
import CompareOrganicModal from './CompareOrganicModal';
import CompareWebsiteAnalyticsModal from './CompareWebsiteAnalyticsModal';
import CompareOrganicTrendModal from './CompareOrganicTrendModal';
import CompareChannelsModal from './CompareChannelsModal';

// ======================== Helpers ========================
function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtVal(v, u) {
  if (u === 'ms') return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`;
  return v.toFixed(3);
}
function fmtDur(s) {
  if (!s || s <= 0) return '0s';
  const m = Math.floor(s / 60); const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// GA4 reports each form event separately. We roll up these completion-event
// names (covering GA4 defaults + WPForms / Contact Form 7 / etc.) so the KPI
// works across plugins. `form_start` is intentionally excluded — it's funnel
// intent, not a submission.
const FORM_SUBMIT_EVENTS = new Set([
  'generate_lead',
  'form_submit',
  'form_submission',
  'contact_form',
  'contact_form_submit',
  'wpforms_submit',
]);

function sumEventsByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.eventCount || 0) : sum),
    0
  );
}

function sumEventUsersByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.totalUsers || 0) : sum),
    0
  );
}

// 7-day over prior-7-day delta on a daily time series. Returns { direction, pct } or null.
function computeDelta(data, key) {
  if (!Array.isArray(data) || data.length < 14) return null;
  const last7 = data.slice(-7).reduce((s, d) => s + (d[key] || 0), 0);
  const prev7 = data.slice(-14, -7).reduce((s, d) => s + (d[key] || 0), 0);
  if (prev7 === 0) return last7 > 0 ? { direction: 'new' } : null;
  const pct = ((last7 - prev7) / prev7) * 100;
  return {
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
    pct: Math.abs(pct),
  };
}

// ======================== Primitives ========================

function DeltaChip({ delta }) {
  if (!delta) return null;
  if (delta.direction === 'new') {
    return <span className="text-[10px] font-semibold font-label px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">NEW</span>;
  }
  if (delta.direction === 'flat') {
    return <span className="text-[10px] font-semibold font-label px-1.5 py-0.5 rounded bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline">—</span>;
  }
  const isUp = delta.direction === 'up';
  const cls = isUp
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${cls} font-label`}>
      {isUp ? '↑' : '↓'}{delta.pct.toFixed(1)}%
    </span>
  );
}

function MiniSparkline({ data, dataKey, color, height = 36 }) {
  if (!data || data.length < 2) return null;
  const gradId = `spark-${dataKey}-${color.replace('#', '')}`;
  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.75} fill={`url(#${gradId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ label, value, delta, sparkline, hint, accent }) {
  if (accent) {
    return (
      <div className={`py-3 px-4 rounded-xl border ${accent.border} ${accent.bg} ${accent.color} space-y-2 relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-current opacity-[0.03] rounded-full group-hover:scale-110 transition-transform duration-500" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.2em] truncate">
            {label}
          </p>
          <DeltaChip delta={delta} />
        </div>
        <p className="text-2xl font-headline font-extrabold text-brand-on-surface dark:text-white tabular-nums leading-tight">
          {value}
        </p>
        {sparkline && <MiniSparkline data={sparkline.data} dataKey={sparkline.dataKey} color={sparkline.color} />}
        {hint && (
          <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant font-medium font-label">{hint}</p>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-3 flex flex-col gap-1.5 hover:border-brand-outline-variant dark:hover:border-brand-outline transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-wider truncate">
          {label}
        </span>
        <DeltaChip delta={delta} />
      </div>
      <span className="text-2xl font-bold font-label text-brand-on-surface dark:text-white tabular-nums leading-tight">
        {value}
      </span>
      {sparkline && <MiniSparkline data={sparkline.data} dataKey={sparkline.dataKey} color={sparkline.color} />}
      {hint && (
        <span className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant leading-tight font-label">{hint}</span>
      )}
    </div>
  );
}

const GA_STAT_ACCENTS = [
  { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-500/5', border: 'border-indigo-100 dark:border-indigo-500/20' },
  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-500/5', border: 'border-emerald-100 dark:border-emerald-500/20' },
  { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-500/5', border: 'border-amber-100 dark:border-amber-500/20' },
  { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-500/5', border: 'border-rose-100 dark:border-rose-500/20' },
  { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-500/5', border: 'border-violet-100 dark:border-violet-500/20' },
];

function PanelCard({ title, action, children, className = '' }) {
  return (
    <div className={`rounded-xl shadow-sm transition-all hover:shadow-md bg-brand-surface-container-lowest dark:bg-brand-on-surface p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h4 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline uppercase tracking-wider font-label">{title}</h4>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 90) return '#10b981'; // emerald
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function Gauge({ score, label }) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];
  return (
    <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-3 flex flex-col items-center">
      <div className="w-28 h-28 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
            <RadialBar background={{ fill: 'currentColor', fillOpacity: 0.1 }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-label text-brand-on-surface dark:text-white tabular-nums" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline mt-1 text-center">{label}</span>
    </div>
  );
}

// ======================== Section 1: Site Health ========================
function SiteHealthSection({ scores }) {
  if (!scores) return null;
  return (
    <ReportSection
      title="Site Health"
      description="Lighthouse audit scores across performance, accessibility, best practices, and SEO."
      accent="violet"
      icon={GaugeIcon}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Gauge score={scores.performance || 0} label="Performance" />
        <Gauge score={scores.accessibility || 0} label="Accessibility" />
        <Gauge score={scores.bestPractices || 0} label="Best Practices" />
        <Gauge score={scores.seo || 0} label="SEO" />
      </div>
    </ReportSection>
  );
}

// ======================== Section 2: Core Web Vitals ========================
const CWV = [
  { key: 'fcp', label: 'FCP', unit: 'ms', good: 1800, poor: 3000, max: 6000, full: 'First Contentful Paint' },
  { key: 'lcp', label: 'LCP', unit: 'ms', good: 2500, poor: 4000, max: 8000, full: 'Largest Contentful Paint' },
  { key: 'tbt', label: 'TBT', unit: 'ms', good: 200, poor: 600, max: 1200, full: 'Total Blocking Time' },
  { key: 'cls', label: 'CLS', unit: '', good: 0.1, poor: 0.25, max: 0.5, full: 'Cumulative Layout Shift' },
  { key: 'si', label: 'SI', unit: 'ms', good: 3400, poor: 5800, max: 10000, full: 'Speed Index' },
];

function CoreVitalsSection({ scores }) {
  if (!scores) return null;
  const metrics = CWV.filter((m) => scores[m.key] != null);
  if (metrics.length === 0) return null;

  return (
    <ReportSection
      title="Core Web Vitals"
      description="Real-user performance thresholds measured by Lighthouse — Good, Needs Work, or Poor."
      accent="violet"
      icon={GaugeIcon}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => {
          const val = scores[m.key];
          const pct = Math.min((val / m.max) * 100, 100);
          const barColor = val <= m.good ? '#10b981' : val <= m.poor ? '#f59e0b' : '#ef4444';
          const status = val <= m.good ? 'Good' : val <= m.poor ? 'Needs Work' : 'Poor';
          const chipCls =
            val <= m.good ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
            val <= m.poor ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
            'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
          return (
            <div key={m.key} className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-label text-brand-on-surface dark:text-brand-outline" title={m.full}>{m.label}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${chipCls} font-label`}>{status}</span>
              </div>
              <p className="text-2xl font-bold text-brand-on-surface dark:text-white tabular-nums leading-tight font-headline">{fmtVal(val, m.unit)}</p>
              <div className="h-1.5 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

// ======================== Off-Page: Domain Authority ========================
function DomainAuthoritySection({ siteId, themeKey }) {
  return (
    <ReportSection
      title="Domain Authority"
      description="Trust score, total backlinks, referring domains, and link gains or losses in the selected window."
      accent="amber"
      icon={LinkIcon}
    >
      <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4">
        <BacklinksSection siteId={siteId} themeKey={themeKey} showTitle={false} variant="domain-authority" />
      </div>
    </ReportSection>
  );
}

// ======================== Off-Page: Backlinks list ========================
function BacklinksListSection({ siteId, themeKey }) {
  return (
    <ReportSection
      title="Backlinks Analysis"
      description="The list of external sources currently pointing at your site."
      accent="amber"
      icon={LinkIcon}
    >
      <BacklinksSection siteId={siteId} themeKey={themeKey} showTitle={false} variant="backlinks" />
    </ReportSection>
  );
}

// ======================== Off-Page: Keyword Rankings ========================
function KeywordRankingsChartsSection({ siteId }) {
  return (
    <ReportSection
      title="Keyword Rankings"
      description="Positions, movement, and visibility for the keywords you're actively tracking."
      accent="amber"
      icon={LinkIcon}
    >
      <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4">
        <TopKeywordsPanel siteId={siteId} />
      </div>
    </ReportSection>
  );
}

// ======================== Section 4: Google Search Console ========================
function GSCSection({ siteId, themeKey }) {
  const { gscStatus } = useGscStatus(siteId);
  const { performance, isLoading } = useGscPerformance(siteId, '28d');
  const { insights, isLoading: insightsLoading } = useGscInsights(siteId, '28d');

  if (!gscStatus?.linked) return null;

  if (isLoading) {
    return (
      <ReportSection title="Google Search Console" description="Impressions, clicks, and position from Google Search." accent="blue" icon={SearchIcon}>
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      </ReportSection>
    );
  }

  const totals = performance?.totals || {};
  const daily = performance?.daily || [];
  const topPages = (insights?.pages || []).slice(0, 5);
  const topKw = (insights?.queries || []).slice(0, 5);
  const maxPageImp = Math.max(...topPages.map(p => p.impressions), 1);
  const maxKwImp = Math.max(...topKw.map(q => q.impressions), 1);

  const clicksDelta = computeDelta(daily, 'clicks');
  const impDelta = computeDelta(daily, 'impressions');

  return (
    <ReportSection
      title="Google Search Console"
      description="Impressions, clicks, and position from Google Search — last 28 days."
      accent="blue"
      icon={SearchIcon}
    >
      {/* Clicks chart (2/3) + KPI stack (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PanelCard title="Clicks" className="md:col-span-2" action={<DeltaChip delta={clicksDelta} />}>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-label text-brand-on-surface dark:text-white tabular-nums">{fmt(totals.clicks)}</span>
            <span className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant font-label">Last 28 days</span>
          </div>
          {daily.length > 1 && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <defs><linearGradient id="gscClicksDash" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} /><stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="clicks" stroke={themeColor(themeKey, 0)} strokeWidth={2} fill="url(#gscClicksDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelCard>

        <div className="flex flex-col gap-3">
          <StatCard
            label="Impressions"
            value={fmt(totals.impressions)}
            delta={impDelta}
            sparkline={daily.length > 1 ? { data: daily, dataKey: 'impressions', color: themeColor(themeKey, 1) } : null}
          />
          <StatCard
            label="Avg Position"
            value={totals.position ? totals.position.toFixed(1) : '—'}
            hint="Lower is better"
          />
        </div>
      </div>

      {/* Top Pages + Top Keywords */}
      {!insightsLoading && (topPages.length > 0 || topKw.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topPages.length > 0 && (
            <PanelCard title="Top Pages by Impressions">
              <div className="space-y-2">
                {topPages.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] mb-0.5 font-label">
                      <span className="text-brand-on-surface dark:text-brand-outline truncate max-w-[220px] ">{p.page.replace(/^https?:\/\/[^/]+/, '')}</span>
                      <span className="text-brand-on-surface-variant tabular-nums">{fmt(p.impressions)}</span>
                    </div>
                    <div className="h-1.5 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.impressions / maxPageImp) * 100}%`, backgroundColor: themeColor(themeKey, 0) }} />
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>
          )}
          {topKw.length > 0 && (
            <PanelCard title="Top Keywords by Impressions">
              <div className="space-y-2">
                {topKw.map((q, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] mb-0.5 font-label">
                      <span className="text-brand-on-surface dark:text-brand-outline truncate max-w-[220px]">{q.query}</span>
                      <span className="text-brand-on-surface-variant tabular-nums">{fmt(q.impressions)}</span>
                    </div>
                    <div className="h-1.5 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(q.impressions / maxKwImp) * 100}%`, backgroundColor: themeColor(themeKey, 2) }} />
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>
          )}
        </div>
      )}
    </ReportSection>
  );
}

// ======================== Section 5: Google Analytics ========================
function GASection({ siteId, themeKey }) {
  const { analyticsStatus } = useAnalyticsStatus(siteId);
  const period = useSeoReportStore((s) => s.period);
  const customFrom = useSeoReportStore((s) => s.customFrom);
  const customTo = useSeoReportStore((s) => s.customTo);
  const dateRange = computeDateRange(period, customFrom, customTo);
  const { data, isLoading, isFetching } = useWebsiteAnalytics(siteId, period, dateRange);
  const filtersMutation = useAnalyticsFilters(siteId);
  const [pendingScope, setPendingScope] = useState(null);
  const refreshing = filtersMutation.isPending || (isFetching && !isLoading);
  useEffect(() => { if (!refreshing) setPendingScope(null); }, [refreshing]);
  const channelsRefreshing = pendingScope === 'channels' && refreshing;
  const pagesRefreshing = pendingScope === 'pages' && refreshing;
  const [compareOpen, setCompareOpen] = useState(false);
  const [channelsCompareOpen, setChannelsCompareOpen] = useState(false);

  if (!analyticsStatus?.linked) return null;

  if (isLoading) {
    return (
      <ReportSection title="Google Analytics" description="GA4 engagement and conversion metrics." accent="emerald" icon={AnalyticsIcon}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-3 flex flex-col gap-2">
              <Sk className="h-2.5 w-16 rounded-full" />
              <Sk className="h-7 w-16" />
              <Sk className="h-2 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4">
          <Sk className="h-3 w-32 mb-3 rounded-full" />
          <Sk className="h-48 w-full rounded-xl" />
        </div>
      </ReportSection>
    );
  }

  const overview = data?.overview || {};
  const events = data?.details?.events || {};
  const channels = data?.details?.channels || [];
  const topPages = (data?.details?.topPages || []).slice(0, 5);

  const filters = analyticsStatus?.filters || { excludedCountries: [], excludedTopPages: [] };
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

  const fileDownloads = sumEventUsersByName(events.allEvents, (n) => n === 'file_download');
  const websiteRequests = sumEventUsersByName(events.allEvents, (n) => FORM_SUBMIT_EVENTS.has(n));
  const uniqueVisitors = overview.uniqueVisitors || 0;
  const bounceRatePct = overview.bounceRate != null ? `${(overview.bounceRate * 100).toFixed(1)}%` : '—';
  const avgTime = fmtDur(overview.avgTimeOnPage);

  const barData = channels.slice(0, 6).map((c, i) => ({ name: c.channel.length > 12 ? c.channel.slice(0, 12) + '...' : c.channel, sessions: c.sessions, fill: themeColor(themeKey, i) }));

  return (
    <ReportSection
      title="Google Analytics"
      description="GA4 engagement and conversion metrics."
      accent="emerald"
      icon={AnalyticsIcon}
    >
      <div className="bg-white px-4 py-6 rounded-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium font-label uppercase">
            All Traffic
          </span>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
            title="Compare against a past period"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* google Analytics */}
          <StatCard label="File Downloads" value={fmt(fileDownloads)} hint="Users who downloaded a file" accent={GA_STAT_ACCENTS[0]} />
          <StatCard label="Form Submitted" value={fmt(websiteRequests)} hint="Users who completed a form" accent={GA_STAT_ACCENTS[1]} />
          <StatCard label="Unique Visitors" value={fmt(uniqueVisitors)} hint="Distinct users" accent={GA_STAT_ACCENTS[2]} />
          <StatCard label="Bounce Rate" value={bounceRatePct} hint="Single-page sessions" accent={GA_STAT_ACCENTS[3]} />
          <StatCard label="Avg. Time on Page" value={avgTime} hint="Per session" accent={GA_STAT_ACCENTS[4]} />
        </div>
      </div>

      {(barData.length > 0 || topPages.length > 0 || (filters.excludedTopPages || []).length > 0) && (
        <div className="grid grid-cols-12 gap-6">
          {barData.length > 0 && (() => {
            const totalChannelSessions = barData.reduce((s, b) => s + (b.sessions || 0), 0);
            const leader = barData.reduce((best, b) => (b.sessions > (best?.sessions || 0) ? b : best), null);
            const leaderPct = leader && totalChannelSessions > 0 ? ((leader.sessions / totalChannelSessions) * 100).toFixed(1) : '0';
            return (
              <PanelCard
              // Sessions by Channel
                title="Sessions by Channel"
                className="col-span-12 lg:col-span-8"
                action={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChannelsCompareOpen(true)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
                      title="Compare against a past period"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                      Compare
                    </button>
                    <CountryFilterDropdown
                      siteId={siteId}
                      dateRange={dateRange}
                      excluded={filters.excludedCountries || []}
                      onChange={setExcludedCountries}
                    />
                  </div>
                }
              >
                {/* Summary strip */}
                {/* <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-brand-surface-container-low/60 dark:bg-brand-on-surface/40 px-3 py-2 border border-brand-outline-variant/60 dark:border-brand-outline/60">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-brand-outline font-label font-bold">Total Sessions</div>
                    <div className="text-lg font-headline font-extrabold tabular-nums text-brand-on-surface dark:text-white leading-tight">{fmt(totalChannelSessions)}</div>
                  </div>
                  <div className="rounded-lg bg-brand-surface-container-low/60 dark:bg-brand-on-surface/40 px-3 py-2 border border-brand-outline-variant/60 dark:border-brand-outline/60">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-brand-outline font-label font-bold">Top Channel</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold font-label text-brand-on-surface dark:text-white truncate" title={leader?.name}>{leader?.name || '—'}</span>
                      <span className="text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 font-label">{leaderPct}%</span>
                    </div>
                  </div>
                  <div className="hidden sm:block rounded-lg bg-brand-surface-container-low/60 dark:bg-brand-on-surface/40 px-3 py-2 border border-brand-outline-variant/60 dark:border-brand-outline/60">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-brand-outline font-label font-bold">Channels</div>
                    <div className="text-lg font-headline font-extrabold tabular-nums text-brand-on-surface dark:text-white leading-tight">{barData.length}</div>
                  </div>
                </div> */}

                {/* Chart */}
                <div className="h-96 relative">
                  {channelsRefreshing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-brand-on-surface/60 backdrop-blur-[1px] rounded-lg z-10">
                      <Spinner size="sm" />
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 24, right: 10, bottom: 5, left: -10 }} barCategoryGap="22%">
                      <defs>
                        {barData.map((e, i) => (
                          <linearGradient key={i} id={`channelBar${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={e.fill} stopOpacity={1} />
                            <stop offset="100%" stopColor={e.fill} stopOpacity={0.55} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="2 6" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => fmt(v)}
                        width={45}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.98)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '11px',
                          boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.12)',
                          padding: '8px 12px',
                        }}
                        formatter={(value) => [fmt(value), 'Sessions']}
                        labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}
                      />
                      <Bar dataKey="sessions" radius={[8, 8, 2, 2]} maxBarSize={68}>
                        {barData.map((e, i) => <Cell key={i} fill={`url(#channelBar${i})`} />)}
                        <LabelList
                          dataKey="sessions"
                          position="top"
                          formatter={(v) => fmt(v)}
                          style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            );
          })()}

          {(topPages.length > 0 || (filters.excludedTopPages || []).length > 0) && (
            <PanelCard
              title="Top 5 Pages Visited"
              className={barData.length > 0 ? 'col-span-12 lg:col-span-4' : 'col-span-12'}
            >
              <TopPagesVisitedTable
                pages={topPages}
                themeKey={themeKey}
                excludedPages={filters.excludedTopPages || []}
                onExclude={excludePage}
                onRestore={restorePage}
                isRefreshing={pagesRefreshing}
                siteId={siteId}
              />
            </PanelCard>
          )}
        </div>
      )}

      <CompareWebsiteAnalyticsModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        siteId={siteId}
        currentData={data}
        currentLabel="Current Period"
      />

      <CompareChannelsModal
        isOpen={channelsCompareOpen}
        onClose={() => setChannelsCompareOpen(false)}
        siteId={siteId}
        currentChannels={channels}
        currentLabel="Current Period"
      />
    </ReportSection>
  );
}

// ======================== Section 6: Search Rankings ========================
function TablesSection({ siteId, themeKey }) {
  const { gscStatus } = useGscStatus(siteId);
  const { insights, isLoading } = useGscInsights(siteId, '28d');
  if (!gscStatus?.linked || isLoading || !insights) return null;

  return (
    <ReportSection
      title="Search Rankings"
      description="Full breakdown of top queries and pages from Google Search."
      accent="blue"
      icon={SearchIcon}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PanelCard title="Top Queries"><TopQueriesTable queries={insights.queries} themeKey={themeKey} /></PanelCard>
        <PanelCard title="Top Pages"><TopPagesTable pages={insights.pages} themeKey={themeKey} /></PanelCard>
      </div>
    </ReportSection>
  );
}

// ======================== Section 7: Organic Traffic ========================
function OrganicSection({ siteId, themeKey }) {
  const { analyticsStatus } = useAnalyticsStatus(siteId);
  const period = useSeoReportStore((s) => s.period);
  const customFrom = useSeoReportStore((s) => s.customFrom);
  const customTo = useSeoReportStore((s) => s.customTo);
  const dateRange = computeDateRange(period, customFrom, customTo);
  const { data: overviewData, isLoading } = useAnalyticsOverview(siteId, period, dateRange);
  const { insights, isLoading: insightsLoading } = useAnalyticsInsights(siteId, period, dateRange);
  const [compareOpen, setCompareOpen] = useState(false);
  const [trendCompareOpen, setTrendCompareOpen] = useState(false);

  if (!analyticsStatus?.linked) return null;

  if (isLoading) {
    return (
      <ReportSection title="Organic Traffic" description="GA4 organic-search acquisition and breakdown." accent="emerald" icon={AnalyticsIcon}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-3 flex flex-col gap-2">
              <Sk className="h-2.5 w-16 rounded-full" />
              <Sk className="h-7 w-16" />
              <Sk className="h-2 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4">
          <Sk className="h-3 w-36 mb-3 rounded-full" />
          <Sk className="h-44 w-full rounded-xl" />
        </div>
      </ReportSection>
    );
  }

  const ov = overviewData?.overview || {};
  const trend = overviewData?.trend || [];
  const newU = ov.newUsers || 0;
  const retU = ov.returningUsers || 0;
  const totalU = newU + retU;
  const devices = insights?.devices || [];
  const countries = insights?.countries || [];

  const sessionsDelta = computeDelta(trend, 'sessions');
  const userDonut = [
    { name: 'New', value: newU, color: themeColor(themeKey, 0) },
    { name: 'Returning', value: retU, color: themeColor(themeKey, 2) },
  ];
  const deviceDonut = devices.map((d, i) => ({ name: d.device, value: d.sessions, color: themeColor(themeKey, i) }));

  return (
    <ReportSection
      title="Organic Traffic"
      description="GA4 organic-search acquisition — sessions, engagement, and audience breakdown."
      accent="emerald"
      icon={AnalyticsIcon}
    >
      {/* KPI row */}
      <div className="bg-white px-4 py-6 rounded-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium font-label uppercase">
            Organic Search
          </span>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
            title="Compare against a past period"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Organic Sessions',
            value: fmt(ov.sessions),
            delta: sessionsDelta,
            sparkline: trend.length > 1 ? { data: trend, dataKey: 'sessions', color: themeColor(themeKey, 0) } : null,
            bar: 'bg-[#6366F1] dark:bg-[#818CF8]',
          },
          {
            label: 'Engagement Rate',
            value: ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—',
            hint: 'Engaged / total sessions',
            bar: 'bg-[#10B981] dark:bg-[#34D399]',
          },
          {
            label: 'Avg. Engagement',
            value: fmtDur(ov.avgEngagementTime),
            hint: 'Per engaged session',
            bar: 'bg-[#F59E0B] dark:bg-[#FBBF24]',
          },
          {
            label: 'Conversions',
            value: fmt(ov.conversions),
            hint: 'Key events fired',
            bar: 'bg-[#8B5CF6] dark:bg-[#A78BFA]',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative rounded-xl bg-white dark:bg-brand-surface-container-lowest border border-brand-outline-variant/70 dark:border-brand-outline/60 px-4 pt-4 pb-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-brand-outline-variant dark:hover:border-brand-outline transition-all overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 right-0 h-[1px] ${stat.bar}`} />
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.18em] truncate">
                {stat.label}
              </p>
              <DeltaChip delta={stat.delta} />
            </div>
            <p className="text-[26px] font-headline font-extrabold text-brand-on-surface dark:text-white tabular-nums leading-none mb-1">
              {stat.value}
            </p>
            {stat.sparkline && <MiniSparkline data={stat.sparkline.data} dataKey={stat.sparkline.dataKey} color={stat.sparkline.color} />}
            {stat.hint && (
              <p className="text-[10.5px] text-brand-outline dark:text-brand-on-surface-variant font-medium font-label leading-tight">{stat.hint}</p>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Trend chart + New vs Returning */}
      {(trend.length > 1 || totalU > 0) && (
        <div className="grid grid-cols-12 gap-3">
          {trend.length > 1 && (
            <PanelCard
              title="Organic Sessions Trend"
              className={totalU > 0 ? 'col-span-12 lg:col-span-8' : 'col-span-12'}
              action={
                <button
                  type="button"
                  onClick={() => setTrendCompareOpen(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
                  title="Compare against a past period"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  Compare
                </button>
              }
            >
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <defs><linearGradient id="orgTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} /><stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="sessions" stroke={themeColor(themeKey, 0)} strokeWidth={2} fill="url(#orgTrendGrad)" name="Sessions" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PanelCard>
          )}
          {totalU > 0 && (
            <PanelCard className={trend.length > 1 ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
              <NewVsReturningChart newUsers={newU} returningUsers={retU} themeKey={themeKey} siteId={siteId} />
            </PanelCard>
          )}
        </div>
      )}

      {/* New vs Returning / Device Breakdown / Top Countries — disabled */}
      {/*
      {!insightsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {totalU > 0 && (
            <PanelCard title="New vs Returning">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={userDonut} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value" stroke="none">
                      {userDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  {userDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-label">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-brand-on-surface-variant dark:text-brand-outline">{d.name}</span>
                      <span className="font-semibold font-label text-brand-on-surface dark:text-white tabular-nums ml-auto">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PanelCard>
          )}

          {deviceDonut.length > 0 && (
            <PanelCard title="Device Breakdown">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={deviceDonut} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value" stroke="none">
                      {deviceDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  {deviceDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-label">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-brand-on-surface-variant dark:text-brand-outline capitalize">{d.name.toLowerCase()}</span>
                      <span className="font-semibold font-label text-brand-on-surface dark:text-white tabular-nums ml-auto">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PanelCard>
          )}

          {countries.length > 0 && (
            <PanelCard title="Top Countries">
              <div className="space-y-1.5">
                {countries.slice(0, 5).map((c, i) => (
                  <div key={c.country} className="flex items-center gap-2 text-[11px] font-label">
                    <span className="text-brand-on-surface-variant w-16 truncate">{c.country}</span>
                    <div className="flex-1 h-1.5 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.sessions / (countries[0]?.sessions || 1)) * 100}%`, backgroundColor: themeColor(themeKey, i % 6) }} />
                    </div>
                    <span className="text-brand-on-surface dark:text-brand-outline font-semibold font-label tabular-nums">{fmt(c.sessions)}</span>
                  </div>
                ))}
              </div>
            </PanelCard>
          )}
        </div>
      )}
      */}

      <CompareOrganicModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        siteId={siteId}
        currentOverview={ov}
        currentLabel="Current Period"
      />

      <CompareOrganicTrendModal
        isOpen={trendCompareOpen}
        onClose={() => setTrendCompareOpen(false)}
        siteId={siteId}
        currentTrend={trend}
        currentLabel="Current Period"
      />
    </ReportSection>
  );
}

// ======================== Section 8: Score Trends ========================
const SCORE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const SCORE_KEYS = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

function ScoreTrendSection({ history, historyLoading, strategy }) {
  if (historyLoading) {
    return (
      <ReportSection title="Score Trends" description="Lighthouse scores over time." accent="violet" icon={GaugeIcon}>
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      </ReportSection>
    );
  }

  const data = (history || [])
    .filter((h) => h.pageSpeed?.[strategy])
    .map((h) => ({ date: new Date(h.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ...h.pageSpeed[strategy] }));

  if (data.length < 2) return null;

  return (
    <ReportSection
      title="Score Trends"
      description="Lighthouse audit scores over time — track improvements or regressions."
      accent="violet"
      icon={GaugeIcon}
    >
      <PanelCard title="Scores over Time">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
              {SCORE_KEYS.map((s, i) => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={SCORE_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} name={s.label} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>
    </ReportSection>
  );
}

// ======================== Main Export ========================
// eslint-disable-next-line no-unused-vars
export default function ChartsDashboard({ siteId, themeKey, scores, strategy, history, historyLoading }) {
  return (
    <div className="space-y-10">
      {/* Website — GA4: unique visitors, bounce rate, avg time, file downloads,
          form submissions, sessions by channel, top 5 pages visited. */}
      <GASection siteId={siteId} themeKey={themeKey} />

      {/* Website — GA4 organic-search acquisition and breakdown. */}
      <OrganicSection siteId={siteId} themeKey={themeKey} />

      {/* SEO (off-page) — DA score, backlinks count, new/lost links. */}
      <DomainAuthoritySection siteId={siteId} themeKey={themeKey} />

      {/* SEO — Top 3 keywords with SERP position. */}
      <KeywordRankingsChartsSection siteId={siteId} />

      {/* SEO (off-page) — detailed list of external sources pointing to the site. */}
      <BacklinksListSection siteId={siteId} themeKey={themeKey} />

      {/* ──────────────────────────────────────────────────────────────────────
          The sections below are intentionally disabled per current client scope.
          Uncomment any of them to re-enable without code changes.
          ────────────────────────────────────────────────────────────────────── */}
      {/*
      <SiteHealthSection scores={scores} />
      <CoreVitalsSection scores={scores} />
      <ScoreTrendSection history={history} historyLoading={historyLoading} strategy={strategy} />
      <GSCSection siteId={siteId} themeKey={themeKey} />
      <TablesSection siteId={siteId} themeKey={themeKey} />
      */}
    </div>
  );
}
