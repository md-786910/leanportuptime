import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import { themeColor, gaugeColor } from './colorThemes';
import { useGscStatus, useGscPerformance, useGscInsights } from '../../hooks/useSearchConsole';
import { useAnalyticsStatus, useWebsiteAnalytics, useAnalyticsOverview, useAnalyticsInsights } from '../../hooks/useAnalytics';
import { useBacklinksStatus, useBacklinksRefresh } from '../../hooks/useBacklinks';
import { useIsViewer } from '../../hooks/useRole';
import TopQueriesTable from './TopQueriesTable';
import TopPagesTable from './TopPagesTable';

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

function SectionTitle({ title }) {
  return <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">{title}</h3>;
}

function MiniSparkline({ data, dataKey, color, height = 40 }) {
  if (!data || data.length < 2) return null;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs><linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#spark-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SparkCard({ icon, title, value, data, dataKey, color }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{title}</span>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
      </div>
      <MiniSparkline data={data} dataKey={dataKey} color={color} height={36} />
    </div>
  );
}

function KpiMini({ icon, title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{title}</span></div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
    </div>
  );
}

const CHART_ICON = <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z" /></svg>;
const GSC_ICON = <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

function MiniGauge({ score, label, themeKey }) {
  const color = gaugeColor(score, themeKey);
  const data = [{ value: score, fill: color }];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col items-center">
      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</span>
      <div className="w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" startAngle={90} endAngle={-270} data={data}>
            <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={4} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-900 dark:fill-white">{score}</text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ======================== Section 1: Site Health ========================
function SiteHealthSection({ scores, themeKey }) {
  if (!scores) return null;
  return (
    <div>
      <SectionTitle title="Site Health" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniGauge score={scores.performance || 0} label="Performance Score" themeKey={themeKey} />
        <MiniGauge score={scores.accessibility || 0} label="Accessibility Score" themeKey={themeKey} />
        <MiniGauge score={scores.bestPractices || 0} label="Best Practices Score" themeKey={themeKey} />
        <MiniGauge score={scores.seo || 0} label="SEO Score" themeKey={themeKey} />
      </div>
    </div>
  );
}

// ======================== Section 2: Google Analytics ========================
function GASection({ siteId, themeKey }) {
  const { analyticsStatus } = useAnalyticsStatus(siteId);
  const { data, isLoading } = useWebsiteAnalytics(siteId, '28d');
  const { data: organicData } = useAnalyticsOverview(siteId, '28d');

  if (!analyticsStatus?.linked) return null;
  if (isLoading) return <div><SectionTitle title="Google Analytics" /><div className="flex justify-center py-8"><Spinner size="sm" /></div></div>;

  const overview = data?.overview || {};
  const events = data?.details?.events || {};
  const channels = data?.details?.channels || [];
  const trend = organicData?.trend || [];
  const totalSessions = channels.reduce((sum, c) => sum + c.sessions, 0);
  const conversions = organicData?.overview?.conversions || 0;

  const barData = channels.slice(0, 6).map((c, i) => ({ name: c.channel.length > 12 ? c.channel.slice(0, 12) + '...' : c.channel, sessions: c.sessions, fill: themeColor(themeKey, i) }));

  return (
    <div>
      <SectionTitle title="Google Analytics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <SparkCard icon={CHART_ICON} title="Sessions" value={fmt(totalSessions)} data={trend} dataKey="sessions" color={themeColor(themeKey, 0)} />
        <SparkCard icon={CHART_ICON} title="Total Users" value={fmt(overview.uniqueVisitors)} data={trend} dataKey="sessions" color={themeColor(themeKey, 1)} />
        <KpiMini icon={CHART_ICON} title="Bounce Rate" value={overview.bounceRate != null ? `${(overview.bounceRate * 100).toFixed(1)}%` : '—'} />
        <KpiMini icon={CHART_ICON} title="Conversions" value={fmt(conversions)} />
      </div>

      {barData.length > 0 && (
        <Card>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Sessions by Channel</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

// ======================== Section 3: Google Search Console ========================
function GSCSection({ siteId, themeKey }) {
  const { gscStatus } = useGscStatus(siteId);
  const { performance, isLoading } = useGscPerformance(siteId, '28d');
  const { insights, isLoading: insightsLoading } = useGscInsights(siteId, '28d');

  if (!gscStatus?.linked) return null;
  if (isLoading) return <div><SectionTitle title="Google Search Console" /><div className="flex justify-center py-8"><Spinner size="sm" /></div></div>;

  const totals = performance?.totals || {};
  const daily = performance?.daily || [];
  const topPages = (insights?.pages || []).slice(0, 5);
  const topKw = (insights?.queries || []).slice(0, 5);
  const maxPageImp = Math.max(...topPages.map(p => p.impressions), 1);
  const maxKwImp = Math.max(...topKw.map(q => q.impressions), 1);

  return (
    <div>
      <SectionTitle title="Google Search Console" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {/* Clicks chart — spans 2 cols */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">{GSC_ICON}<span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Clicks</span></div>
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{fmt(totals.clicks)}</span>
          </div>
          {daily.length > 1 && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <defs><linearGradient id="gscClicksDash" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} /><stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="clicks" stroke={themeColor(themeKey, 0)} strokeWidth={2} fill="url(#gscClicksDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* KPI stack */}
        <div className="flex flex-col gap-3">
          <KpiMini icon={GSC_ICON} title="Avg Position" value={totals.position ? totals.position.toFixed(1) : '—'} />
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">{GSC_ICON}<span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Impressions</span></div>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{fmt(totals.impressions)}</span>
            </div>
            <MiniSparkline data={daily} dataKey="impressions" color={themeColor(themeKey, 1)} height={32} />
          </div>
        </div>
      </div>

      {/* Top Pages + Top Keywords by Impressions */}
      {!insightsLoading && (topPages.length > 0 || topKw.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topPages.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">{GSC_ICON} Top Pages by Impressions</h4>
              <div className="space-y-2">
                {topPages.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px] font-mono">{p.page.replace(/^https?:\/\/[^/]+/, '')}</span>
                      <span className="text-gray-500 tabular-nums">{fmt(p.impressions)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.impressions / maxPageImp) * 100}%`, backgroundColor: themeColor(themeKey, 0) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topKw.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">{GSC_ICON} Top Keywords by Impressions</h4>
              <div className="space-y-2">
                {topKw.map((q, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{q.query}</span>
                      <span className="text-gray-500 tabular-nums">{fmt(q.impressions)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(q.impressions / maxKwImp) * 100}%`, backgroundColor: themeColor(themeKey, 2) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ======================== Section 4: Full Tables ========================
function TablesSection({ siteId, themeKey }) {
  const { gscStatus } = useGscStatus(siteId);
  const { insights, isLoading } = useGscInsights(siteId, '28d');
  if (!gscStatus?.linked || isLoading || !insights) return null;

  return (
    <div>
      <SectionTitle title="Search Rankings" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card><TopQueriesTable queries={insights.queries} themeKey={themeKey} /></Card>
        <Card><TopPagesTable pages={insights.pages} themeKey={themeKey} /></Card>
      </div>
    </div>
  );
}

// ======================== Section 5: Core Web Vitals ========================
const CWV = [
  { key: 'fcp', label: 'FCP', unit: 'ms', good: 1800, poor: 3000, max: 6000 },
  { key: 'lcp', label: 'LCP', unit: 'ms', good: 2500, poor: 4000, max: 8000 },
  { key: 'tbt', label: 'TBT', unit: 'ms', good: 200, poor: 600, max: 1200 },
  { key: 'cls', label: 'CLS', unit: '', good: 0.1, poor: 0.25, max: 0.5 },
  { key: 'si', label: 'SI', unit: 'ms', good: 3400, poor: 5800, max: 10000 },
];

function CoreVitalsSection({ scores }) {
  if (!scores) return null;
  const metrics = CWV.filter((m) => scores[m.key] != null);
  if (metrics.length === 0) return null;

  return (
    <div>
      <SectionTitle title="Core Web Vitals" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => {
          const val = scores[m.key];
          const pct = Math.min((val / m.max) * 100, 100);
          const barColor = val <= m.good ? '#10b981' : val <= m.poor ? '#f59e0b' : '#ef4444';
          const status = val <= m.good ? 'Good' : val <= m.poor ? 'Needs Work' : 'Poor';
          return (
            <div key={m.key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{m.label}</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: barColor + '20', color: barColor }}>{status}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mb-2">{fmtVal(val, m.unit)}</p>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================== Section 6: Domain Authority / Backlinks ========================
const METRIC_LABELS = {
  domain_rank: 'Domain Rank',
  domain_authority: 'Domain Authority',
  citation_flow: 'Citation Flow',
  trust_flow: 'Trust Flow',
};

function daysAgo(date) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d < 1) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

function BacklinksSection({ siteId, themeKey }) {
  const { status, isLoading } = useBacklinksStatus(siteId);
  const refresh = useBacklinksRefresh(siteId);
  const isViewer = useIsViewer();

  if (isLoading) {
    return <div><SectionTitle title="Domain Authority" /><div className="flex justify-center py-8"><Spinner size="sm" /></div></div>;
  }

  const data = status?.backlinks || {};
  const quota = status?.quota || { used: 0, limit: 4, remaining: 4 };
  const providerInfo = status?.providerInfo || {};
  const hasData = status?.hasData;
  const isStale = status?.isStale;
  const quotaExhausted = quota.remaining <= 0;
  const providerNotConfigured = !providerInfo.configured;

  const scoreLabel = METRIC_LABELS[data.providerMetric] || 'Domain Score';
  const providerDisplay = data.providerName
    ? data.providerName.charAt(0).toUpperCase() + data.providerName.slice(1)
    : (providerInfo.name || 'unknown');

  const handleRefresh = () => {
    if (quotaExhausted || providerNotConfigured || refresh.isPending) return;
    refresh.mutate();
  };

  // Empty state — never fetched
  if (!hasData) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Domain Authority</h3>
          {!isViewer && (
            <span className={`text-[10px] font-semibold px-2 py-1 rounded ${quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'} tabular-nums`}>
              {quota.used} / {quota.limit} this month
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {isViewer ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-1">No backlinks data available</p>
              <p className="text-[10px] text-gray-400 text-center max-w-[240px]">Contact the site owner to fetch backlinks data.</p>
            </>
          ) : providerNotConfigured ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-1">Provider Not Configured</p>
              <p className="text-[10px] text-gray-400 text-center max-w-[240px]">Set BACKLINKS_PROVIDER and credentials in server environment</p>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={quotaExhausted || refresh.isPending}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
                  quotaExhausted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
                title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
              >
                {refresh.isPending ? 'Fetching...' : 'Fetch Backlinks Data'}
              </button>
              <p className="text-[10px] text-gray-400 mt-2">Uses 1 of {quota.remaining} remaining refreshes this month</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Data present
  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Domain Authority</h3>
          {isStale && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Stale</span>
          )}
        </div>
        {!isViewer && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded tabular-nums ${
                quotaExhausted
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : `${quota.remaining} refreshes remaining this month`}
            >
              {quota.used} / {quota.limit} this month
            </span>
            <button
              onClick={handleRefresh}
              disabled={quotaExhausted || refresh.isPending || providerNotConfigured}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                quotaExhausted || providerNotConfigured
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
            >
              <svg className={`w-3 h-3 ${refresh.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refresh.isPending ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">{scoreLabel}</span>
          <p className="text-2xl font-bold my-1 tabular-nums" style={{ color: themeColor(themeKey, 0) }}>{data.domainRank || 0}</p>
          <span className="text-[9px] text-gray-400">{providerDisplay}</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Backlinks</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white my-1 tabular-nums">{fmt(data.backlinksCount)}</p>
          <span className="text-[9px] text-gray-400">Total links</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Ref. Domains</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white my-1 tabular-nums">{fmt(data.referringDomains)}</p>
          <span className="text-[9px] text-gray-400">Unique sources</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">New Links</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 my-1 tabular-nums">+{fmt(data.newLinksLast30d)}</p>
          <span className="text-[9px] text-gray-400">Last 30 days</span>
        </div>
      </div>

      {/* "No data found" notice when provider returned zeros */}
      {data.domainRank === 0 && data.backlinksCount === 0 && data.referringDomains === 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">No backlinks data found for this domain</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                The domain may be new or not yet indexed by {providerDisplay}. Large established sites typically have richer data.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.lastFetchedAt && (
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Last updated {daysAgo(data.lastFetchedAt)} &middot; Provider: {providerDisplay}
        </p>
      )}
    </div>
  );
}

// ======================== Section 7: Organic Traffic ========================
function OrganicSection({ siteId, themeKey }) {
  const { analyticsStatus } = useAnalyticsStatus(siteId);
  const { data: overviewData, isLoading } = useAnalyticsOverview(siteId, '28d');
  const { insights, isLoading: insightsLoading } = useAnalyticsInsights(siteId, '28d');

  if (!analyticsStatus?.linked) return null;
  if (isLoading) return <div><SectionTitle title="Organic Traffic" /><div className="flex justify-center py-8"><Spinner size="sm" /></div></div>;

  const ov = overviewData?.overview || {};
  const trend = overviewData?.trend || [];
  const newU = ov.newUsers || 0;
  const retU = ov.returningUsers || 0;
  const totalU = newU + retU;
  const devices = insights?.devices || [];
  const countries = insights?.countries || [];

  const userDonut = [
    { name: 'New', value: newU, color: themeColor(themeKey, 0) },
    { name: 'Returning', value: retU, color: themeColor(themeKey, 2) },
  ];
  const deviceDonut = devices.map((d, i) => ({ name: d.device, value: d.sessions, color: themeColor(themeKey, i) }));

  return (
    <div>
      <SectionTitle title="Organic Traffic" />
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <SparkCard icon={CHART_ICON} title="Organic Sessions" value={fmt(ov.sessions)} data={trend} dataKey="sessions" color={themeColor(themeKey, 0)} />
        <KpiMini icon={CHART_ICON} title="Engagement Rate" value={ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—'} />
        <KpiMini icon={CHART_ICON} title="Avg. Time" value={fmtDur(ov.avgEngagementTime)} />
        <KpiMini icon={CHART_ICON} title="Conversions" value={fmt(ov.conversions)} />
      </div>

      {/* Trend chart (full width) */}
      {trend.length > 1 && (
        <Card>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Organic Sessions Trend</h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <defs><linearGradient id="orgTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} /><stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="sessions" stroke={themeColor(themeKey, 0)} strokeWidth={2} fill="url(#orgTrendGrad)" name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Donuts + Country bars */}
      {!insightsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* New vs Returning */}
          {totalU > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">New vs Returning</h4>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={userDonut} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value" stroke="none">
                      {userDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {userDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white tabular-nums ml-auto">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Device */}
          {deviceDonut.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Device Breakdown</h4>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={deviceDonut} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value" stroke="none">
                      {deviceDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {deviceDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{d.name.toLowerCase()}</span>
                      <span className="font-semibold text-gray-900 dark:text-white tabular-nums ml-auto">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Countries */}
          {countries.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Top Countries</h4>
              <div className="space-y-1.5">
                {countries.slice(0, 5).map((c, i) => (
                  <div key={c.country} className="flex items-center gap-2 text-[11px]">
                    <span className="text-gray-500 w-16 truncate">{c.country}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.sessions / (countries[0]?.sessions || 1)) * 100}%`, backgroundColor: themeColor(themeKey, i % 6) }} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold tabular-nums">{fmt(c.sessions)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
  if (historyLoading) return <div><SectionTitle title="Score Trends" /><div className="flex justify-center py-8"><Spinner size="sm" /></div></div>;

  const data = (history || [])
    .filter((h) => h.pageSpeed?.[strategy])
    .map((h) => ({ date: new Date(h.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ...h.pageSpeed[strategy] }));

  if (data.length < 2) return null;

  return (
    <div>
      <SectionTitle title="Score Trends" />
      <Card>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
      </Card>
    </div>
  );
}

// ======================== Main Export ========================
export default function ChartsDashboard({ siteId, themeKey, scores, strategy, history, historyLoading }) {
  return (
    <div className="space-y-8">
      <SiteHealthSection scores={scores} themeKey={themeKey} />
      <GASection siteId={siteId} themeKey={themeKey} />
      <GSCSection siteId={siteId} themeKey={themeKey} />
      <TablesSection siteId={siteId} themeKey={themeKey} />
      <CoreVitalsSection scores={scores} />
      <BacklinksSection siteId={siteId} themeKey={themeKey} />
      <OrganicSection siteId={siteId} themeKey={themeKey} />
      <ScoreTrendSection history={history} historyLoading={historyLoading} strategy={strategy} />
    </div>
  );
}
