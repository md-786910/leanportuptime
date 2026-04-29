import { forwardRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { themeColor, gaugeColor } from './colorThemes';

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
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`;
}
function shortDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// Fits A4 portrait (210mm - 16mm margins = 194mm ≈ 733px @ 96dpi). Chart+table
// containers use this as the explicit pixel width so off-screen rendering
// doesn't depend on "100%" resolving correctly.
const CONTENT_WIDTH = 672;

const TD_TRUNCATE = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function Section({ title, children }) {
  return (
    <div style={{ breakInside: 'avoid', marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  );
}

function KpiBox({ label, value, color, hint }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#111827' }}>{value}</div>
      {hint && <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function MiniGaugePrint({ score, label, themeKey }) {
  const color = gaugeColor(score, themeKey);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ width: 80, height: 80, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ value: score, fill: color }]}>
            <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={4} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 16, fontWeight: 700, fill: '#111827' }}>{score}</text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CWV = [
  { key: 'fcp', label: 'FCP', unit: 'ms', good: 1800, poor: 3000, max: 6000 },
  { key: 'lcp', label: 'LCP', unit: 'ms', good: 2500, poor: 4000, max: 8000 },
  { key: 'tbt', label: 'TBT', unit: 'ms', good: 200, poor: 600, max: 1200 },
  { key: 'cls', label: 'CLS', unit: '', good: 0.1, poor: 0.25, max: 0.5 },
  { key: 'si', label: 'SI', unit: 'ms', good: 3400, poor: 5800, max: 10000 },
];

const SCORE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const METRIC_LABELS = {
  domain_rank: 'Domain Rank',
  domain_authority: 'Domain Authority',
  citation_flow: 'Citation Flow',
  trust_flow: 'Trust Flow',
};

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

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function pathOf(url) {
  try {
    const u = new URL(url);
    const p = u.pathname + u.search;
    return p === '/' ? '/' : p;
  } catch { return url; }
}

function positionColor(position) {
  if (position == null) return '#9ca3af';
  if (position <= 10) return '#059669';
  if (position <= 30) return '#d97706';
  return '#6b7280';
}

const ReportPrintLayout = forwardRef(function ReportPrintLayout({
  siteName, siteUrl, themeKey,
  websiteData, organicOverview, backlinks, keywords,
  scores, strategy, history,
}, ref) {
  const tk = themeKey || 'default';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Site Performance / Score history ───────────────────────────────────────
  const trendHistory = (history || [])
    .filter((h) => h.pageSpeed?.[strategy])
    .map((h) => ({
      date: new Date(h.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...h.pageSpeed[strategy],
    }));

  // ── GA / website data ──────────────────────────────────────────────────────
  const websiteOverview = websiteData?.overview || {};
  const channels = websiteData?.details?.channels || [];
  const topPages = websiteData?.details?.topPages || [];
  const websiteEvents = websiteData?.details?.events || {};
  const allEvents = Array.isArray(websiteEvents.allEvents) ? websiteEvents.allEvents : [];
  const fileDownloads = sumEventUsersByName(allEvents, (n) => n === 'file_download');
  const formRequests = sumEventUsersByName(allEvents, (n) => FORM_SUBMIT_EVENTS.has(n));
  const hasWebsiteAnalytics = Boolean(
    websiteData?.overview || channels.length > 0 || allEvents.length > 0
  );

  // ── Organic data ───────────────────────────────────────────────────────────
  const ov = organicOverview?.overview || {};
  const trend = organicOverview?.trend || [];
  const newU = ov.newUsers || 0;
  const retU = ov.returningUsers || 0;
  const totalU = newU + retU;
  const userDonut = [
    { name: 'New Users', value: newU, color: themeColor(tk, 0) },
    { name: 'Returning Users', value: retU, color: themeColor(tk, 2) },
  ];

  // ── Backlinks data ─────────────────────────────────────────────────────────
  const hasBacklinks = Boolean(backlinks && backlinks.lastFetchedAt);
  const backlinkItems = Array.isArray(backlinks?.items) ? backlinks.items : [];
  const topBacklinks = backlinkItems.slice(0, 10);

  // ── Keyword rankings ───────────────────────────────────────────────────────
  const sortedKeywords = Array.isArray(keywords)
    ? [...keywords].sort((a, b) => {
        if (a.position == null && b.position == null) return 0;
        if (a.position == null) return 1;
        if (b.position == null) return -1;
        return a.position - b.position;
      })
    : [];
  const hasKeywords = sortedKeywords.length > 0;

  return (
    <div ref={ref} style={{ width: 720, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#ffffff', color: '#111827', padding: 24, fontSize: 12 }}>

      {/* ===== COVER ===== */}
      <div style={{ textAlign: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '3px solid #2563eb' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{siteName || 'SEO Report'}</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{siteUrl}</p>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>SEO Performance Report</h2>
        <p style={{ fontSize: 11, color: '#9ca3af' }}>Generated on {today}</p>
      </div>

      {/* ===== 1. GOOGLE ANALYTICS REPORT ===== */}
      {hasWebsiteAnalytics && (
        <Section title="1. Google Analytics Report">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <KpiBox label="File Downloads" value={fmt(fileDownloads)} color={themeColor(tk, 0)} hint="Users who downloaded a file" />
            <KpiBox label="Form Submitted" value={fmt(formRequests)} color={themeColor(tk, 1)} hint="Users who completed a form" />
            <KpiBox label="Unique Visitors" value={fmt(websiteOverview.uniqueVisitors)} color={themeColor(tk, 2)} hint="Distinct users" />
            <KpiBox label="Bounce Rate" value={websiteOverview.bounceRate != null ? `${(websiteOverview.bounceRate * 100).toFixed(1)}%` : '—'} hint="Single-page sessions" />
            <KpiBox label="Avg. Time on Page" value={fmtDur(websiteOverview.avgTimeOnPage)} hint="Per session" />
          </div>
        </Section>
      )}

      {/* ===== 2. SESSIONS BY CHANNEL & TOP 5 PAGES VISITED ===== */}
      {(channels.length > 0 || topPages.length > 0) && (
        <Section title="2. Sessions by Channel & Top 5 Pages Visited">
          {channels.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sessions by Channel</div>
              <div style={{ width: CONTENT_WIDTH, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channels.slice(0, 6).map((c, i) => ({ name: c.channel.length > 14 ? c.channel.slice(0, 14) + '...' : c.channel, sessions: c.sessions, fill: themeColor(tk, i) }))} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                      {channels.slice(0, 6).map((_, i) => <Cell key={i} fill={themeColor(tk, i)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {topPages.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Top 5 Pages Visited</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '74%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Page</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Page Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 5).map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 10, color: '#111827', ...TD_TRUNCATE }} title={p.page}>{p.page}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: themeColor(tk, 0) }}>{fmt(p.pageViews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ===== 3. ORGANIC TRAFFIC ===== */}
      {ov.sessions != null && (
        <Section title="3. Organic Traffic">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <KpiBox label="Organic Sessions" value={fmt(ov.sessions)} color={themeColor(tk, 0)} hint="Distinct sessions" />
            <KpiBox label="Engagement Rate" value={ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—'} color={themeColor(tk, 1)} hint="Engaged / total sessions" />
            <KpiBox label="Avg. Engagement" value={fmtDur(ov.avgEngagementTime)} color={themeColor(tk, 3)} hint="Per engaged session" />
            <KpiBox label="Conversions" value={fmt(ov.conversions)} color={themeColor(tk, 4)} hint="Key events fired" />
          </div>
        </Section>
      )}

      {/* ===== 4. ORGANIC SESSIONS TREND & NEW VS RETURNING ===== */}
      {(trend.length > 1 || totalU > 0) && (
        <Section title="4. Organic Sessions Trend & New vs Returning (Organic)">
          {trend.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Organic Sessions Trend</div>
              <div style={{ width: CONTENT_WIDTH, height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="orgTrendPdfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColor(tk, 0)} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={themeColor(tk, 0)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Area type="monotone" dataKey="sessions" stroke={themeColor(tk, 0)} fill="url(#orgTrendPdfGrad)" strokeWidth={1.75} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {totalU > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New vs Returning (Organic)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userDonut} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                        {userDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  {userDonut.map((d) => {
                    const pct = totalU > 0 ? ((d.value / totalU) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color, display: 'inline-block' }} />
                          <span style={{ fontSize: 11, color: '#374151' }}>{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmt(d.value)}</span>
                          <span style={{ fontSize: 10, color: '#6b7280', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ===== 5. DOMAIN AUTHORITY ===== */}
      {hasBacklinks && (
        <Section title="5. Domain Authority">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <KpiBox label={METRIC_LABELS[backlinks.providerMetric] || 'Domain Score'} value={backlinks.domainRank || 0} color={themeColor(tk, 0)} hint={backlinks.providerName || 'Provider'} />
            <KpiBox label="Backlinks" value={fmt(backlinks.backlinksCount)} hint="Total links" />
            <KpiBox label="Ref. Domains" value={fmt(backlinks.referringDomains)} hint="Unique sources" />
            <KpiBox label="New Links" value={`+${fmt(backlinks.newLinksLast30d ?? 0)}`} color="#059669" hint="Last 30 days" />
            <KpiBox label="Lost Links" value={`-${fmt(backlinks.lostLinksLast30d ?? 0)}`} color="#dc2626" hint="Last 30 days" />
          </div>
          {backlinks.lastFetchedAt && (
            <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'right', marginTop: 6 }}>
              Provider: {backlinks.providerName ? backlinks.providerName.charAt(0).toUpperCase() + backlinks.providerName.slice(1) : 'unknown'}
              {' · Updated '}
              {new Date(backlinks.lastFetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </Section>
      )}

      {/* ===== 6. KEYWORD RANKINGS ===== */}
      {hasKeywords && (
        <Section title="6. Keyword Rankings">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '54%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Keyword</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Position</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Δ</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeywords.slice(0, 10).map((k, i) => {
                const delta = (k.position != null && k.previousPosition != null) ? (k.position - k.previousPosition) : null;
                const deltaColor = delta == null || delta === 0 ? '#9ca3af' : (delta < 0 ? '#059669' : '#dc2626');
                const deltaSign = delta == null || delta === 0 ? '—' : (delta < 0 ? '↑' : '↓');
                return (
                  <tr key={k.keyword || i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{i + 1}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 500, ...TD_TRUNCATE }} title={k.keyword}>{k.keyword}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: positionColor(k.position) }}>
                      {k.position == null ? 'Not ranked' : k.position}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: deltaColor, fontWeight: 600 }}>
                      {delta == null || delta === 0 ? '—' : `${deltaSign} ${Math.abs(delta)}`}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{k.searchVolume != null ? fmt(k.searchVolume) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ===== 7. BACKLINKS ANALYSIS ===== */}
      {hasBacklinks && (
        <Section title="7. Backlinks Analysis">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <KpiBox label="Total Backlinks" value={fmt(backlinks.backlinksCount)} color={themeColor(tk, 0)} hint="Inbound links" />
            <KpiBox label="Referring Domains" value={fmt(backlinks.referringDomains)} color={themeColor(tk, 1)} hint="Unique sources" />
            <KpiBox label="Net 30-Day Gain" value={`${(((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0)) >= 0) ? '+' : ''}${fmt((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0))}`} color={((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0)) >= 0 ? '#059669' : '#dc2626'} hint="New − lost" />
            <KpiBox label="Listed Sources" value={fmt(backlinkItems.length)} hint="In source list" />
          </div>
        </Section>
      )}

      {/* ===== 8. SEO BACKLINKS — TOP 10 ===== */}
      {topBacklinks.length > 0 && (
        <Section title="8. SEO Backlinks (Top 10)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>#</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Source</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Anchor</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Target</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Type</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>First Seen</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, color: '#6b7280', fontSize: 9 }}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {topBacklinks.map((r, i) => (
                <tr key={r._id || `${r.sourceUrl}-${i}`} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 6px', color: '#9ca3af', fontSize: 9 }}>{i + 1}</td>
                  <td style={{ padding: '4px 6px', color: '#2563eb', ...TD_TRUNCATE }} title={r.sourceUrl}>{hostOf(r.sourceUrl)}</td>
                  <td style={{ padding: '4px 6px', color: '#111827', ...TD_TRUNCATE }} title={r.anchor || '—'}>{r.anchor || '—'}</td>
                  <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: 9, color: '#4b5563', ...TD_TRUNCATE }} title={r.targetUrl}>{pathOf(r.targetUrl)}</td>
                  <td style={{ padding: '4px 6px', color: '#4b5563', textTransform: 'capitalize', ...TD_TRUNCATE }} title={r.linkType || 'anchor'}>{r.linkType || 'anchor'}</td>
                  <td style={{ padding: '4px 6px', color: '#6b7280', fontSize: 9, ...TD_TRUNCATE }}>{shortDate(r.firstSeen)}</td>
                  <td style={{ padding: '4px 6px', color: '#6b7280', fontSize: 9, ...TD_TRUNCATE }}>{shortDate(r.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'right', marginTop: 6 }}>
            Showing top 10 of {backlinkItems.length} backlinks.
          </p>
        </Section>
      )}

      {/* ===== 9. SITE PERFORMANCE ===== */}
      {scores && (
        <Section title="9. Site Performance">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <MiniGaugePrint score={scores.performance || 0} label="Performance" themeKey={tk} />
            <MiniGaugePrint score={scores.accessibility || 0} label="Accessibility" themeKey={tk} />
            <MiniGaugePrint score={scores.bestPractices || 0} label="Best Practices" themeKey={tk} />
            <MiniGaugePrint score={scores.seo || 0} label="SEO Score" themeKey={tk} />
          </div>
          {strategy && (
            <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'right', marginTop: 6 }}>
              Lighthouse strategy: {strategy}
            </p>
          )}
        </Section>
      )}

      {/* ===== 10. SCORE TRENDS ===== */}
      {trendHistory.length >= 2 && (
        <Section title="10. Score Trends">
          <div style={{ width: CONTENT_WIDTH, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendHistory} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                {[
                  { key: 'performance', label: 'Performance' },
                  { key: 'accessibility', label: 'Accessibility' },
                  { key: 'bestPractices', label: 'Best Practices' },
                  { key: 'seo', label: 'SEO' },
                ].map((s, i) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={SCORE_COLORS[i]} strokeWidth={2} dot={{ r: 2 }} name={s.label} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ===== 11. CORE WEB VITALS ===== */}
      {scores && CWV.some((m) => scores[m.key] != null) && (
        <Section title="11. Core Web Vitals">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {CWV.filter((m) => scores[m.key] != null).map((m) => {
              const val = scores[m.key];
              const barColor = val <= m.good ? '#10b981' : val <= m.poor ? '#f59e0b' : '#ef4444';
              const status = val <= m.good ? 'Good' : val <= m.poor ? 'Needs Work' : 'Poor';
              const pct = Math.min((val / m.max) * 100, 100);
              return (
                <div key={m.key} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '4px 0' }}>{fmtVal(val, m.unit)}</div>
                  <div style={{ height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, backgroundColor: barColor, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: barColor, marginTop: 4 }}>{status}</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ===== FOOTER ===== */}
      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #e5e7eb', marginTop: 24 }}>
        <p style={{ fontSize: 10, color: '#9ca3af' }}>Generated by WP Sentinel &middot; {today}</p>
      </div>
    </div>
  );
});

export default ReportPrintLayout;
