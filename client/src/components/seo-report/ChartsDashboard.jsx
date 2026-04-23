import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import Spinner from '../common/Spinner';
import { themeColor } from './colorThemes';
import { useGscStatus, useGscPerformance, useGscInsights } from '../../hooks/useSearchConsole';
import { useAnalyticsStatus, useWebsiteAnalytics, useAnalyticsOverview, useAnalyticsInsights } from '../../hooks/useAnalytics';
import TopQueriesTable from './TopQueriesTable';
import TopPagesTable from './TopPagesTable';
import BacklinksSection from './BacklinksSection';
import TopKeywordsPanel from './TopKeywordsPanel';
import ReportSection from './ReportSection';
import { GaugeIcon, SearchIcon, AnalyticsIcon, LinkIcon } from './chartIcons';

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

const FORM_EVENT_NAMES = new Set([
  'generate_lead', 'form_submit', 'form_start', 'contact_form',
  'form_submission', 'contact_form_submit', 'wpforms_submit',
]);

function sumEventsByName(allEvents, matcher) {
  if (!Array.isArray(allEvents)) return 0;
  return allEvents.reduce(
    (sum, e) => (matcher(e.eventName) ? sum + (e.eventCount || 0) : sum),
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

function StatCard({ label, value, delta, sparkline, hint }) {
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

function PanelCard({ title, action, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4 ${className}`}>
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

// ======================== Section 3: Domain Authority ========================
function DomainAuthoritySection({ siteId, themeKey }) {
  return (
    <ReportSection
      title="Domain Authority"
      description="Off-page signals — backlinks, referring domains, and domain rank across the web."
      accent="amber"
      icon={LinkIcon}
    >
      <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 p-4">
        <BacklinksSection siteId={siteId} themeKey={themeKey} showTitle={false} />
        <div className="mt-6 pt-6 border-t border-brand-outline-variant dark:border-brand-outline">
          <TopKeywordsPanel siteId={siteId} />
        </div>
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
  const { data, isLoading } = useWebsiteAnalytics(siteId, '28d');

  if (!analyticsStatus?.linked) return null;

  if (isLoading) {
    return (
      <ReportSection title="Google Analytics" description="GA4 engagement and conversion metrics." accent="emerald" icon={AnalyticsIcon}>
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      </ReportSection>
    );
  }

  const overview = data?.overview || {};
  const events = data?.details?.events || {};
  const channels = data?.details?.channels || [];

  const fileDownloads = sumEventsByName(events.allEvents, (n) => n === 'file_download');
  const websiteRequests = sumEventsByName(events.allEvents, (n) => FORM_EVENT_NAMES.has(n));
  const uniqueVisitors = overview.uniqueVisitors || 0;
  const bounceRatePct = overview.bounceRate != null ? `${(overview.bounceRate * 100).toFixed(1)}%` : '—';
  const avgTime = fmtDur(overview.avgTimeOnPage);

  const barData = channels.slice(0, 6).map((c, i) => ({ name: c.channel.length > 12 ? c.channel.slice(0, 12) + '...' : c.channel, sessions: c.sessions, fill: themeColor(themeKey, i) }));

  return (
    <ReportSection
      title="Google Analytics"
      description="GA4 engagement and conversion metrics — last 28 days."
      accent="emerald"
      icon={AnalyticsIcon}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="File Downloads" value={fmt(fileDownloads)} hint="file_download events" />
        <StatCard label="Form Submitted" value={fmt(websiteRequests)} hint="Contact form submissions" />
        <StatCard label="Unique Visitors" value={fmt(uniqueVisitors)} hint="Distinct users" />
        <StatCard label="Bounce Rate" value={bounceRatePct} hint="Single-page sessions" />
        <StatCard label="Avg. Time on Page" value={avgTime} hint="Per session" />
      </div>

      {barData.length > 0 && (
        <PanelCard title="Sessions by Channel">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      )}
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
  const { data: overviewData, isLoading } = useAnalyticsOverview(siteId, '28d');
  const { insights, isLoading: insightsLoading } = useAnalyticsInsights(siteId, '28d');

  if (!analyticsStatus?.linked) return null;

  if (isLoading) {
    return (
      <ReportSection title="Organic Traffic" description="GA4 organic-search acquisition and breakdown." accent="emerald" icon={AnalyticsIcon}>
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Organic Sessions"
          value={fmt(ov.sessions)}
          delta={sessionsDelta}
          sparkline={trend.length > 1 ? { data: trend, dataKey: 'sessions', color: themeColor(themeKey, 0) } : null}
        />
        <StatCard
          label="Engagement Rate"
          value={ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—'}
          hint="Engaged / total sessions"
        />
        <StatCard
          label="Avg. Engagement"
          value={fmtDur(ov.avgEngagementTime)}
          hint="Per engaged session"
        />
        <StatCard
          label="Conversions"
          value={fmt(ov.conversions)}
          hint="Key events fired"
        />
      </div>

      {/* Trend chart (full width) */}
      {trend.length > 1 && (
        <PanelCard title="Organic Sessions Trend">
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

      {/* Donuts + Country bars */}
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
export default function ChartsDashboard({ siteId, themeKey, scores, strategy, history, historyLoading }) {
  return (
    <div className="space-y-10">
      <SiteHealthSection scores={scores} />
      <CoreVitalsSection scores={scores} />
      <DomainAuthoritySection siteId={siteId} themeKey={themeKey} />
      <GSCSection siteId={siteId} themeKey={themeKey} />
      <GASection siteId={siteId} themeKey={themeKey} />
      <TablesSection siteId={siteId} themeKey={themeKey} />
      <OrganicSection siteId={siteId} themeKey={themeKey} />
      <ScoreTrendSection history={history} historyLoading={historyLoading} strategy={strategy} />
    </div>
  );
}
