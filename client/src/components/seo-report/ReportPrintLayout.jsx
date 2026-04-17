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

function Section({ title, children }) {
  return (
    <div style={{ breakInside: 'avoid', marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  );
}

function KpiBox({ label, value, color }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#111827' }}>{value}</div>
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

const ReportPrintLayout = forwardRef(function ReportPrintLayout({ siteName, siteUrl, scores, strategy, history, themeKey, gscPerformance, gscInsights, websiteData, organicOverview, organicInsights }, ref) {
  const tk = themeKey || 'default';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const channels = websiteData?.details?.channels || [];
  const totalSessions = channels.reduce((sum, c) => sum + c.sessions, 0);
  const gscTotals = gscPerformance?.totals || {};
  const gscDaily = gscPerformance?.daily || [];
  const queries = gscInsights?.queries || [];
  const pages = gscInsights?.pages || [];
  const ov = organicOverview?.overview || {};
  const trend = organicOverview?.trend || [];
  const devices = organicInsights?.devices || [];
  const countries = organicInsights?.countries || [];

  const trendHistory = (history || [])
    .filter((h) => h.pageSpeed?.[strategy])
    .map((h) => ({ date: new Date(h.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ...h.pageSpeed[strategy] }));

  return (
    <div ref={ref} style={{ width: 794, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#ffffff', color: '#111827', padding: 32, fontSize: 12 }}>

      {/* ===== COVER ===== */}
      <div style={{ textAlign: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '3px solid #2563eb' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{siteName || 'SEO Report'}</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{siteUrl}</p>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>SEO Performance Report</h2>
        <p style={{ fontSize: 11, color: '#9ca3af' }}>Generated on {today}</p>
      </div>

      {/* ===== SITE HEALTH ===== */}
      {scores && (
        <Section title="Site Health — Google Lighthouse">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <MiniGaugePrint score={scores.performance || 0} label="Performance" themeKey={tk} />
            <MiniGaugePrint score={scores.accessibility || 0} label="Accessibility" themeKey={tk} />
            <MiniGaugePrint score={scores.bestPractices || 0} label="Best Practices" themeKey={tk} />
            <MiniGaugePrint score={scores.seo || 0} label="SEO Score" themeKey={tk} />
          </div>
        </Section>
      )}

      {/* ===== CORE WEB VITALS ===== */}
      {scores && (
        <Section title="Core Web Vitals">
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

      {/* ===== GOOGLE ANALYTICS ===== */}
      {channels.length > 0 && (
        <Section title="Google Analytics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <KpiBox label="Sessions" value={fmt(totalSessions)} color={themeColor(tk, 0)} />
            <KpiBox label="Unique Visitors" value={fmt(websiteData?.overview?.uniqueVisitors)} color={themeColor(tk, 1)} />
            <KpiBox label="Bounce Rate" value={websiteData?.overview?.bounceRate != null ? `${(websiteData.overview.bounceRate * 100).toFixed(1)}%` : '—'} />
            <KpiBox label="Conversions" value={fmt(organicOverview?.overview?.conversions)} color={themeColor(tk, 3)} />
          </div>
          <div style={{ height: 180 }}>
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
        </Section>
      )}

      {/* ===== GOOGLE SEARCH CONSOLE ===== */}
      {(gscTotals.clicks != null || gscDaily.length > 0) && (
        <Section title="Google Search Console">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <KpiBox label="Clicks" value={fmt(gscTotals.clicks)} color={themeColor(tk, 0)} />
            <KpiBox label="Impressions" value={fmt(gscTotals.impressions)} color={themeColor(tk, 1)} />
            <KpiBox label="CTR" value={gscTotals.ctr ? `${(gscTotals.ctr * 100).toFixed(2)}%` : '—'} />
            <KpiBox label="Avg Position" value={gscTotals.position ? gscTotals.position.toFixed(1) : '—'} />
          </div>
          {gscDaily.length > 1 && (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gscDaily} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke={themeColor(tk, 0)} fill={themeColor(tk, 0)} fillOpacity={0.15} strokeWidth={1.5} />
                  <Area yAxisId="right" type="monotone" dataKey="impressions" stroke={themeColor(tk, 1)} fill={themeColor(tk, 1)} fillOpacity={0.1} strokeWidth={1.5} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      )}

      {/* ===== TOP QUERIES TABLE ===== */}
      {queries.length > 0 && (
        <Section title="Top Search Queries">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Query</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Clicks</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Impressions</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>CTR</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {queries.slice(0, 10).map((q, i) => {
                const posColor = q.position <= 10 ? '#059669' : q.position <= 20 ? '#d97706' : '#6b7280';
                return (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{i + 1}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 500 }}>{q.query}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: themeColor(tk, 0) }}>{q.clicks.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{q.impressions.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{(q.ctr * 100).toFixed(2)}%</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: posColor }}>{q.position.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ===== TOP PAGES TABLE ===== */}
      {pages.length > 0 && (
        <Section title="Top Pages">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Page</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Clicks</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Impressions</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>CTR</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#6b7280', fontSize: 10 }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 10).map((p, i) => {
                const posColor = p.position <= 10 ? '#059669' : p.position <= 20 ? '#d97706' : '#6b7280';
                return (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{i + 1}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 10 }}>{p.page.replace(/^https?:\/\/[^/]+/, '')}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: themeColor(tk, 0) }}>{p.clicks.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{p.impressions.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{(p.ctr * 100).toFixed(2)}%</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: posColor }}>{p.position.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ===== ORGANIC TRAFFIC ===== */}
      {ov.sessions != null && (
        <Section title="Organic Traffic">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <KpiBox label="Organic Sessions" value={fmt(ov.sessions)} color={themeColor(tk, 0)} />
            <KpiBox label="Engagement Rate" value={ov.engagementRate != null ? `${(ov.engagementRate * 100).toFixed(1)}%` : '—'} />
            <KpiBox label="Avg. Time" value={fmtDur(ov.avgEngagementTime)} />
            <KpiBox label="Conversions" value={fmt(ov.conversions)} color={themeColor(tk, 3)} />
          </div>
          {trend.length > 1 && (
            <div style={{ height: 140, marginBottom: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="sessions" stroke={themeColor(tk, 0)} fill={themeColor(tk, 0)} fillOpacity={0.15} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {(devices.length > 0 || countries.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {devices.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Device Breakdown</div>
                  {devices.map((d, i) => (
                    <div key={d.device} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ textTransform: 'capitalize', color: '#4b5563' }}>{d.device.toLowerCase()}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(d.sessions)}</span>
                    </div>
                  ))}
                </div>
              )}
              {countries.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Top Countries</div>
                  {countries.slice(0, 5).map((c) => (
                    <div key={c.country} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: '#4b5563' }}>{c.country}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(c.sessions)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ===== SCORE TRENDS ===== */}
      {trendHistory.length >= 2 && (
        <Section title="Score Trends">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendHistory} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                {[{ key: 'performance', label: 'Performance' }, { key: 'accessibility', label: 'Accessibility' }, { key: 'bestPractices', label: 'Best Practices' }, { key: 'seo', label: 'SEO' }].map((s, i) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={SCORE_COLORS[i]} strokeWidth={2} dot={{ r: 2 }} name={s.label} />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
