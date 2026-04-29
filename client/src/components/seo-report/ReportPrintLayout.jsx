import { forwardRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  AreaChart, Area, BarChart, Bar, LineChart, Line, LabelList,
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

const CONTENT_WIDTH = 672;
const TD_TRUNCATE = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const ACCENTS = {
  indigo:  { solid: '#6366F1', soft: '#EEF2FF', text: '#4338CA' },
  emerald: { solid: '#10B981', soft: '#ECFDF5', text: '#047857' },
  amber:   { solid: '#F59E0B', soft: '#FFFBEB', text: '#B45309' },
  violet:  { solid: '#8B5CF6', soft: '#F5F3FF', text: '#6D28D9' },
  blue:    { solid: '#3B82F6', soft: '#EFF6FF', text: '#1D4ED8' },
  rose:    { solid: '#F43F5E', soft: '#FFF1F2', text: '#BE123C' },
  sky:     { solid: '#0EA5E9', soft: '#F0F9FF', text: '#0369A1' },
};

function Section({ number, title, accent = 'indigo', children }) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  return (
    <div style={{ marginBottom: 22, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: a.solid,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', fontWeight: 800, fontSize: 12, flexShrink: 0,
          boxShadow: `0 2px 4px ${a.solid}40`,
        }}>{number}</div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
        <div style={{ flex: 1, height: 2, borderRadius: 1, background: `linear-gradient(to right, ${a.solid}, ${a.solid}00)`, marginLeft: 6 }} />
      </div>
      <div>{children}</div>
    </div>
  );
}

const ACCENT_COLORS_KEYS = ['indigo', 'emerald', 'amber', 'violet', 'rose', 'blue', 'sky'];

function KpiBox({ label, value, hint, accent, accentIndex = 0 }) {
  const key = accent || ACCENT_COLORS_KEYS[accentIndex % ACCENT_COLORS_KEYS.length];
  const a = ACCENTS[key] || ACCENTS.indigo;
  return (
    <div style={{
      position: 'relative',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '14px 12px 12px 12px',
      textAlign: 'center',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 92,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: a.solid }} />
      <div style={{ fontSize: 9.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6, lineHeight: 1.2, minHeight: 12 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
      {hint && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, lineHeight: 1.35, minHeight: 24 }}>{hint}</div>}
    </div>
  );
}

function MiniGaugePrint({ score, label, themeKey }) {
  const color = gaugeColor(score, themeKey);
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '12px 10px 10px 10px',
      textAlign: 'center',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, lineHeight: 1.2, minHeight: 12 }}>{label}</div>
      <div style={{ width: 80, height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ value: score, fill: color }]}>
            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 17, fontWeight: 800, fill: '#0f172a' }}>{score}</text>
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
  if (position == null) return '#94a3b8';
  if (position <= 10) return '#059669';
  if (position <= 30) return '#d97706';
  return '#475569';
}

const TABLE_HEADER_ROW = { background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' };
const TABLE_HEADER_CELL = { textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0' };
const TABLE_BODY_ROW_ALT = { backgroundColor: '#fafafa' };

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
  const totalChannelSessions = channels.reduce((s, c) => s + (c.sessions || 0), 0);

  // ── Organic data ───────────────────────────────────────────────────────────
  const ov = organicOverview?.overview || {};
  const trend = organicOverview?.trend || [];
  const newU = ov.newUsers || 0;
  const retU = ov.returningUsers || 0;
  const totalU = newU + retU;
  const userDonut = [
    { name: 'New Users', value: newU, color: ACCENTS.indigo.solid },
    { name: 'Returning Users', value: retU, color: ACCENTS.emerald.solid },
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
    <div ref={ref} style={{ width: 720, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', backgroundColor: '#ffffff', color: '#0f172a', padding: 18, fontSize: 12 }}>

      {/* ===== COVER ===== */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 22,
        color: '#ffffff',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>By Bright Group</div>
            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              SEO Performance Report
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.02em', lineHeight: 1.25, wordBreak: 'break-word' }}>{siteName || 'Your Website'}</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', margin: 0, fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-all' }}>{siteUrl}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 2 }}>Generated</div>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 14 }}>{today}</div>
          </div>
        </div>
      </div>

      {/* ===== 1. GOOGLE ANALYTICS REPORT ===== */}
      {hasWebsiteAnalytics && (
        <Section number={1} title="Google Analytics Report" accent="indigo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            <KpiBox label="File Downloads" value={fmt(fileDownloads)} hint="Users who downloaded a file" accent="indigo" />
            <KpiBox label="Form Submitted" value={fmt(formRequests)} hint="Users who completed a form" accent="emerald" />
            <KpiBox label="Unique Visitors" value={fmt(websiteOverview.uniqueVisitors)} hint="Distinct users" accent="amber" />
            <KpiBox label="Bounce Rate" value={websiteOverview.bounceRate != null ? `${(websiteOverview.bounceRate * 100).toFixed(1)}%` : '—'} hint="Single-page sessions" accent="rose" />
            <KpiBox label="Avg. Time on Page" value={fmtDur(websiteOverview.avgTimeOnPage)} hint="Per session" accent="violet" />
          </div>
        </Section>
      )}

      {/* ===== 2. SESSIONS BY CHANNEL & TOP 5 PAGES VISITED ===== */}
      {(channels.length > 0 || topPages.length > 0) && (
        <Section number={2} title="Sessions by Channel & Top 5 Pages Visited" accent="emerald">
          {channels.length > 0 && (
            <div style={{ marginBottom: 12, padding: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.04em' }}>Sessions by Channel</span>
                <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600 }}>{fmt(totalChannelSessions)} total sessions</span>
              </div>
              <div style={{ width: CONTENT_WIDTH - 30, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channels.slice(0, 6).map((c, i) => ({
                    name: c.channel.length > 14 ? c.channel.slice(0, 14) + '…' : c.channel,
                    sessions: c.sessions,
                    fill: themeColor(tk, i),
                  }))} margin={{ top: 22, right: 12, bottom: 5, left: -10 }} barCategoryGap="22%">
                    <defs>
                      {channels.slice(0, 6).map((_, i) => (
                        <linearGradient key={i} id={`pdfChGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={themeColor(tk, i)} stopOpacity={1} />
                          <stop offset="100%" stopColor={themeColor(tk, i)} stopOpacity={0.55} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={36} />
                    <Bar dataKey="sessions" radius={[8, 8, 2, 2]} maxBarSize={64}>
                      {channels.slice(0, 6).map((_, i) => <Cell key={i} fill={`url(#pdfChGrad${i})`} />)}
                      <LabelList dataKey="sessions" position="top" formatter={(v) => fmt(v)} style={{ fontSize: 9, fontWeight: 700, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {topPages.length > 0 && (
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#334155' }}>Top 5 Pages Visited</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '74%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr style={TABLE_HEADER_ROW}>
                    <th style={TABLE_HEADER_CELL}>#</th>
                    <th style={TABLE_HEADER_CELL}>Page</th>
                    <th style={{ ...TABLE_HEADER_CELL, textAlign: 'right' }}>Page Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 5).map((p, i) => (
                    <tr key={i} style={i % 2 === 1 ? TABLE_BODY_ROW_ALT : undefined}>
                      <td style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: '#0f172a', ...TD_TRUNCATE }} title={p.page}>{p.page}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: ACCENTS.emerald.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.pageViews)}</td>
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
        <Section number={3} title="Organic Traffic" accent="emerald">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiBox label="Organic Sessions" value={fmt(ov.sessions)} hint="Distinct sessions" accent="indigo" />
            <KpiBox label="Engagement Rate" value={ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—'} hint="Engaged / total sessions" accent="emerald" />
            <KpiBox label="Avg. Engagement" value={fmtDur(ov.avgEngagementTime)} hint="Per engaged session" accent="amber" />
            <KpiBox label="Conversions" value={fmt(ov.conversions)} hint="Key events fired" accent="violet" />
          </div>
        </Section>
      )}

      {/* ===== 4. ORGANIC SESSIONS TREND & NEW VS RETURNING ===== */}
      {(trend.length > 1 || totalU > 0) && (
        <Section number={4} title="Organic Sessions Trend & New vs Returning (Organic)" accent="emerald">
          {trend.length > 1 && (
            <div style={{ marginBottom: 12, padding: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Organic Sessions Trend</div>
              <div style={{ width: CONTENT_WIDTH - 30, height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="orgTrendPdfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENTS.emerald.solid} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={ACCENTS.emerald.solid} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={36} />
                    <Area type="monotone" dataKey="sessions" stroke={ACCENTS.emerald.solid} fill="url(#orgTrendPdfGrad)" strokeWidth={2.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {totalU > 0 && (
            <div style={{ padding: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8 }}>New vs Returning (Organic)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {userDonut.map((entry, i) => (
                          <linearGradient key={i} id={`pdfNvrGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={userDonut} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={6}>
                        {userDonut.map((_, i) => <Cell key={i} fill={`url(#pdfNvrGrad${i})`} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, lineHeight: 1 }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 3 }}>{fmt(totalU)}</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {userDonut.map((d) => {
                    const pct = totalU > 0 ? ((d.value / totalU) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 5, background: '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: d.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#334155', fontWeight: 500, ...TD_TRUNCATE }}>{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</span>
                          <span style={{ fontSize: 10, color: '#64748b', width: 38, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 6, height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', background: '#f1f5f9' }}>
                    {userDonut.map((d, i) => {
                      const pct = totalU > 0 ? (d.value / totalU) * 100 : 0;
                      return <div key={i} style={{ width: `${pct}%`, background: d.color }} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ===== 5. DOMAIN AUTHORITY ===== */}
      {hasBacklinks && (
        <Section number={5} title="Domain Authority" accent="amber">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            <KpiBox label={METRIC_LABELS[backlinks.providerMetric] || 'Domain Score'} value={backlinks.domainRank || 0} hint={backlinks.providerName || 'Provider'} accent="indigo" />
            <KpiBox label="Backlinks" value={fmt(backlinks.backlinksCount)} hint="Total links" accent="emerald" />
            <KpiBox label="Ref. Domains" value={fmt(backlinks.referringDomains)} hint="Unique sources" accent="amber" />
            <KpiBox label="New Links" value={`+${fmt(backlinks.newLinksLast30d ?? 0)}`} hint="Last 30 days" accent="emerald" />
            <KpiBox label="Lost Links" value={`-${fmt(backlinks.lostLinksLast30d ?? 0)}`} hint="Last 30 days" accent="rose" />
          </div>
          {backlinks.lastFetchedAt && (
            <p style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 8, fontWeight: 500 }}>
              Provider: {backlinks.providerName ? backlinks.providerName.charAt(0).toUpperCase() + backlinks.providerName.slice(1) : 'unknown'}
              {' · Updated '}
              {new Date(backlinks.lastFetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </Section>
      )}

      {/* ===== 6. KEYWORD RANKINGS ===== */}
      {hasKeywords && (
        <Section number={6} title="Keyword Rankings" accent="violet">
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '54%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr style={TABLE_HEADER_ROW}>
                  <th style={TABLE_HEADER_CELL}>#</th>
                  <th style={TABLE_HEADER_CELL}>Keyword</th>
                  <th style={{ ...TABLE_HEADER_CELL, textAlign: 'right' }}>Position</th>
                  <th style={{ ...TABLE_HEADER_CELL, textAlign: 'right' }}>Δ</th>
                  <th style={{ ...TABLE_HEADER_CELL, textAlign: 'right' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {sortedKeywords.slice(0, 10).map((k, i) => {
                  const delta = (k.position != null && k.previousPosition != null) ? (k.position - k.previousPosition) : null;
                  const deltaColor = delta == null || delta === 0 ? '#94a3b8' : (delta < 0 ? '#059669' : '#dc2626');
                  const deltaSign = delta == null || delta === 0 ? '—' : (delta < 0 ? '↑' : '↓');
                  const posBadgeColor = positionColor(k.position);
                  return (
                    <tr key={k.keyword || i} style={i % 2 === 1 ? TABLE_BODY_ROW_ALT : undefined}>
                      <td style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#0f172a', ...TD_TRUNCATE }} title={k.keyword}>{k.keyword}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', minWidth: 32, padding: '3px 9px', borderRadius: 6, background: `${posBadgeColor}1A`, color: posBadgeColor, fontWeight: 800, fontSize: 11, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                          {k.position == null ? '—' : k.position}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: deltaColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {delta == null || delta === 0 ? '—' : `${deltaSign} ${Math.abs(delta)}`}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{k.searchVolume != null ? fmt(k.searchVolume) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ===== 7. BACKLINKS ANALYSIS ===== */}
      {hasBacklinks && (
        <Section number={7} title="Backlinks Analysis" accent="amber">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiBox label="Total Backlinks" value={fmt(backlinks.backlinksCount)} hint="Inbound links" accent="indigo" />
            <KpiBox label="Referring Domains" value={fmt(backlinks.referringDomains)} hint="Unique sources" accent="emerald" />
            <KpiBox label="Net 30-Day Gain" value={`${(((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0)) >= 0) ? '+' : ''}${fmt((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0))}`} hint="New − lost" accent={((backlinks.newLinksLast30d ?? 0) - (backlinks.lostLinksLast30d ?? 0)) >= 0 ? 'emerald' : 'rose'} />
            <KpiBox label="Listed Sources" value={fmt(backlinkItems.length)} hint="In source list" accent="violet" />
          </div>
        </Section>
      )}

      {/* ===== 8. SEO BACKLINKS — TOP 10 ===== */}
      {topBacklinks.length > 0 && (
        <Section number={8} title="SEO Backlinks (Top 10)" accent="amber">
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, tableLayout: 'fixed' }}>
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
                <tr style={TABLE_HEADER_ROW}>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>#</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>Source</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>Anchor</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>Target</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>Type</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>First Seen</th>
                  <th style={{ ...TABLE_HEADER_CELL, fontSize: 9.5, padding: '7px 9px' }}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {topBacklinks.map((r, i) => (
                  <tr key={r._id || `${r.sourceUrl}-${i}`} style={i % 2 === 1 ? TABLE_BODY_ROW_ALT : undefined}>
                    <td style={{ padding: '7px 9px', color: '#94a3b8', fontSize: 9.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                    <td style={{ padding: '7px 9px', color: ACCENTS.indigo.text, fontWeight: 500, ...TD_TRUNCATE }} title={r.sourceUrl}>{hostOf(r.sourceUrl)}</td>
                    <td style={{ padding: '7px 9px', color: '#0f172a', ...TD_TRUNCATE }} title={r.anchor || '—'}>{r.anchor || '—'}</td>
                    <td style={{ padding: '7px 9px', fontFamily: 'ui-monospace, monospace', fontSize: 9.5, color: '#475569', ...TD_TRUNCATE }} title={r.targetUrl}>{pathOf(r.targetUrl)}</td>
                    <td style={{ padding: '7px 9px', ...TD_TRUNCATE }} title={r.linkType || 'anchor'}>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, background: ACCENTS.amber.soft, color: ACCENTS.amber.text, fontSize: 9, fontWeight: 700, textTransform: 'capitalize' }}>{r.linkType || 'anchor'}</span>
                    </td>
                    <td style={{ padding: '7px 9px', color: '#64748b', fontSize: 9.5, fontVariantNumeric: 'tabular-nums', ...TD_TRUNCATE }}>{shortDate(r.firstSeen)}</td>
                    <td style={{ padding: '7px 9px', color: '#64748b', fontSize: 9.5, fontVariantNumeric: 'tabular-nums', ...TD_TRUNCATE }}>{shortDate(r.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 8, fontWeight: 500 }}>
            Showing top 10 of {backlinkItems.length} backlinks.
          </p>
        </Section>
      )}

      {/* ===== 9. SITE PERFORMANCE ===== */}
      {scores && (
        <Section number={9} title="Site Performance" accent="blue">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <MiniGaugePrint score={scores.performance || 0} label="Performance" themeKey={tk} />
            <MiniGaugePrint score={scores.accessibility || 0} label="Accessibility" themeKey={tk} />
            <MiniGaugePrint score={scores.bestPractices || 0} label="Best Practices" themeKey={tk} />
            <MiniGaugePrint score={scores.seo || 0} label="SEO Score" themeKey={tk} />
          </div>
          {strategy && (
            <p style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 8, fontWeight: 500 }}>
              Lighthouse strategy: <span style={{ textTransform: 'capitalize', color: '#475569', fontWeight: 700 }}>{strategy}</span>
            </p>
          )}
        </Section>
      )}

      {/* ===== 10. SCORE TRENDS ===== */}
      {trendHistory.length >= 2 && (
        <Section number={10} title="Score Trends" accent="blue">
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', breakInside: 'avoid' }}>
            <div style={{ width: CONTENT_WIDTH - 30, height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendHistory} margin={{ top: 8, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '10px', paddingTop: 6 }} />
                  {[
                    { key: 'performance', label: 'Performance' },
                    { key: 'accessibility', label: 'Accessibility' },
                    { key: 'bestPractices', label: 'Best Practices' },
                    { key: 'seo', label: 'SEO' },
                  ].map((s, i) => (
                    <Line key={s.key} type="monotone" dataKey={s.key} stroke={SCORE_COLORS[i]} strokeWidth={2.25} dot={{ r: 3, strokeWidth: 0 }} name={s.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 11. CORE WEB VITALS ===== */}
      {scores && CWV.some((m) => scores[m.key] != null) && (
        <Section number={11} title="Core Web Vitals" accent="rose">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {CWV.filter((m) => scores[m.key] != null).map((m) => {
              const val = scores[m.key];
              const barColor = val <= m.good ? '#10b981' : val <= m.poor ? '#f59e0b' : '#ef4444';
              const status = val <= m.good ? 'Good' : val <= m.poor ? 'Needs Work' : 'Poor';
              const statusBg = val <= m.good ? '#ECFDF5' : val <= m.poor ? '#FFFBEB' : '#FEF2F2';
              const pct = Math.min((val / m.max) * 100, 100);
              return (
                <div key={m.key} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 12px 12px 12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', minHeight: 100 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', letterSpacing: '0.1em', lineHeight: 1.2, marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 10 }}>{fmtVal(val, m.unit)}</div>
                  <div style={{ height: 5, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, backgroundColor: barColor, borderRadius: 3 }} />
                  </div>
                  <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: barColor, background: statusBg, padding: '3px 10px', borderRadius: 999, lineHeight: 1.4 }}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

    </div>
  );
});

export default ReportPrintLayout;
