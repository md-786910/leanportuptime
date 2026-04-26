import { useState, useEffect } from 'react';
import { useSeoAudit, useSeoTrigger, usePageSpeedFetch } from '../../hooks/useSeo';
import { downloadSeoReport } from '../../api/reports.api';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import ScoreBar from '../security/ScoreBar';
import { formatDate } from '../../utils/formatters';

const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };
const severityVariant = { low: 'neutral', medium: 'info', high: 'warning', critical: 'danger' };

const categoryConfig = {
  'meta-tags': { label: 'Meta Tags', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )},
  content: { label: 'Content', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  links: { label: 'Links', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )},
  performance: { label: 'Performance', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )},
};

const scanningMessages = [
  'Initializing deep audit...',
  'Analyzing meta tag efficiency...',
  'Evaluating semantic structure...',
  'Assessing content quality metrics...',
  'Mapping link integrity...',
  'Communicating with PageSpeed...',
  'Synthesizing final SEO score...',
];

function scoreColor(score) {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function barColor(score) {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function gaugeColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function cwvColor(value, good, poor) {
  if (value <= good) return 'text-emerald-500';
  if (value <= poor) return 'text-amber-500';
  return 'text-red-500';
}

function cwvDotColor(value, good, poor) {
  if (value <= good) return 'bg-emerald-500';
  if (value <= poor) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScanningOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % scanningMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-brand-primary/5 border-brand-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/5 to-transparent animate-pulse" />
      <div className="flex flex-col items-center py-12 gap-6 relative z-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-brand-primary/10" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-brand-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-lg font-black text-brand-on-surface dark:text-white font-headline mb-2">
            Performing Deep SEO Audit
          </h4>
          <p className="text-sm font-medium text-brand-primary animate-pulse h-5">
            {scanningMessages[msgIndex]}
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 w-6 rounded-full bg-brand-primary/20"
            >
              <span 
                className="block h-full bg-brand-primary rounded-full animate-[loading_1.5s_infinite]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CategoryScoreCard({ label, icon, score, passed, total }) {
  const noData = total === 0;

  return (
    <Card className="hover:border-brand-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-brand-primary/5 rounded-xl text-brand-primary">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-brand-outline uppercase tracking-[0.15em]">Category</span>
      </div>
      <h4 className="text-sm font-bold text-brand-on-surface-variant mb-3 font-headline uppercase tracking-tight">{label}</h4>
      {noData ? (
        <p className="text-xs font-semibold text-brand-outline py-2">NO DATA AVAILABLE</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-3xl font-black ${scoreColor(score)} font-headline`}>{score}</span>
            <span className="text-xs font-bold text-brand-outline">/100</span>
          </div>
          <div className="w-full h-2 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden mb-3 shadow-inner">
            <div className={`h-full ${barColor(score)} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold font-label uppercase text-brand-outline">
            <span>Score</span>
            <span>{passed} / {total} Passed</span>
          </div>
        </>
      )}
    </Card>
  );
}

function LighthouseGauge({ label, score, size = 'sm' }) {
  if (score == null) return null;
  const isBig = size === 'lg';
  const radius = isBig ? 54 : 36;
  const svgSize = isBig ? 128 : 88;
  const center = svgSize / 2;
  const strokeW = isBig ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = gaugeColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="drop-shadow-sm">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeW} className="text-brand-surface-container-highest dark:text-brand-on-surface/20" />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={color} strokeWidth={strokeW} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black font-headline text-brand-on-surface dark:text-white" style={{ color, fontSize: isBig ? '32px' : '22px' }}>
            {score}
          </span>
        </div>
      </div>
      <span className={`font-bold font-headline uppercase tracking-tight text-brand-on-surface-variant dark:text-brand-outline text-center ${isBig ? 'text-sm' : 'text-[10px]'}`}>{label}</span>
    </div>
  );
}

function MetricRow({ label, value, unit, good, poor }) {
  if (value == null) return null;
  const displayValue = unit === 'ms'
    ? (value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`)
    : value.toFixed(2);

  const dotColor = cwvDotColor(value, good, poor);
  const colorCls = cwvColor(value, good, poor);

  return (
    <div className="group flex items-center justify-between py-4 border-b border-brand-outline-variant/10 dark:border-brand-outline/10 last:border-0 hover:bg-brand-surface-container-lowest/50 transition-colors px-2 -mx-2 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full shadow-sm ${dotColor}`} />
        <span className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline group-hover:text-brand-primary transition-colors">{label}</span>
      </div>
      <span className={`text-sm font-black tabular-nums bg-opacity-10 px-3 py-1 rounded-full ${colorCls} bg-current`}>
        <span className="opacity-100">{displayValue}{unit && <span className="text-[10px] ml-0.5 opacity-70">{unit}</span>}</span>
      </span>
    </div>
  );
}

function ScoreLegend() {
  return (
    <div className="flex items-center gap-6 p-3 bg-brand-surface-container-low/30 rounded-2xl border border-brand-outline-variant/30 text-[10px] font-black uppercase tracking-widest text-brand-outline font-label">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 border-l-4 border-r-4 border-b-8 border-transparent border-b-red-500" />
        <span>0–49</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 bg-amber-500 rounded-sm" />
        <span>50–89</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
        <span>90–100</span>
      </div>
    </div>
  );
}

function MiniTable({ rows }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-outline-variant/30 dark:border-brand-outline/20 shadow-sm mt-3">
      <table className="w-full text-xs font-label">
        <thead>
          <tr className="bg-brand-surface-container-low/50 dark:bg-brand-on-surface/10">
            {keys.map((k) => (
              <th key={k} className="px-4 py-3 text-left font-bold text-brand-outline uppercase tracking-wider text-[10px]">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-outline-variant/10 dark:divide-brand-outline/10">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-brand-surface-container-lowest/50 dark:hover:bg-brand-on-surface/5 transition-colors">
              {keys.map((k) => (
                <td key={k} className="px-4 py-3 text-brand-on-surface dark:text-brand-outline font-medium">
                  {typeof row[k] === 'number' && String(row[k]).includes('.')
                    ? `${(row[k] * 1).toFixed(2)}%`
                    : row[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValuePill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface-container-low/50 dark:bg-brand-on-surface/20 border border-brand-outline-variant/30 text-[11px] font-semibold text-brand-on-surface dark:text-brand-outline">
      <span className="text-brand-outline text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}

function TagList({ items, variant }) {
  const colorMap = {
    danger: 'bg-red-500/10 text-red-600 border-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    neutral: 'bg-brand-primary/5 text-brand-primary border-brand-primary/10',
  };
  const cls = colorMap[variant] || colorMap.neutral;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, i) => (
        <span key={i} className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border ${cls} font-label`}>{item}</span>
      ))}
    </div>
  );
}

function ValueDisplay({ value }) {
  if (value == null) return null;

  if (typeof value !== 'object') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <ValuePill label="Result" value={value} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === 'object') return <MiniTable rows={value} />;
    return <TagList items={value.map(String)} variant="neutral" />;
  }

  const entries = Object.entries(value);
  const primitiveEntries = [];
  const complexEntries = [];

  for (const [k, v] of entries) {
    if (v == null) continue;
    if (Array.isArray(v) || typeof v === 'object') {
      complexEntries.push([k, v]);
    } else {
      primitiveEntries.push([k, v]);
    }
  }

  return (
    <div className="space-y-4 mt-3">
      {primitiveEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {primitiveEntries.map(([k, v]) => (
            <ValuePill key={k} label={k} value={String(v)} />
          ))}
        </div>
      )}

      {complexEntries.map(([k, v]) => {
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
          return (
            <div key={k} className="mt-4">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-2 font-label">{k}</p>
              <MiniTable rows={v} />
            </div>
          );
        }

        if (Array.isArray(v)) {
          if (v.length === 0) return null;
          const variant = k === 'missing' || k === 'brokenPaths' ? 'danger' : k === 'found' ? 'success' : 'neutral';
          return (
            <div key={k} className="mt-4">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-2 font-label">{k}</p>
              <TagList items={v.map(String)} variant={variant} />
            </div>
          );
        }

        if (typeof v === 'object' && v !== null) {
          return (
            <div key={k} className="mt-4">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-2 font-label">{k}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(v).map(([nk, nv]) => (
                  <ValuePill key={nk} label={nk} value={String(nv)} />
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function CheckRow({ check }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = check.impact || check.fix || check.detail || check.value;
  const isFail = check.status === 'fail';
  const isWarn = check.status === 'warn';
  const isPass = check.status === 'pass';

  return (
    <div className={`group rounded-2xl border transition-all duration-300 ${
      expanded ? 'border-brand-primary bg-brand-surface-container-low/20 shadow-lg' : 'border-brand-outline-variant/30 hover:border-brand-primary/30'
    }`}>
      <button
        type="button"
        onClick={() => hasExpandable && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-left ${hasExpandable ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isPass ? 'bg-emerald-500/10 text-emerald-500' : isFail ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {isPass ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-brand-on-surface dark:text-white font-headline leading-tight">{check.check}</p>
            <p className="text-xs font-semibold text-brand-outline truncate font-label mt-0.5">{check.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {check.severity && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
              check.severity === 'high' || check.severity === 'critical' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-brand-outline border-brand-outline/20'
            }`}>
              {check.severity}
            </span>
          )}
          {hasExpandable && (
            <div className={`p-1 rounded-full transition-all duration-300 bg-brand-surface-container-high ${expanded ? 'rotate-180 bg-brand-primary text-white' : 'text-brand-outline group-hover:text-brand-primary'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-brand-outline-variant/10 dark:bg-brand-outline/10" />
          
          {(check.impact || check.fix) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {check.impact && (
                <div className="rounded-2xl p-4 bg-brand-surface-container-lowest/50 border border-brand-outline-variant/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black text-brand-outline uppercase tracking-[0.15em] font-label">Impact Analysis</span>
                  </div>
                  <p className="text-xs font-bold text-brand-on-surface-variant leading-relaxed">{check.impact}</p>
                </div>
              )}
              {check.fix && (
                <div className="rounded-2xl p-4 bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-[0.15em] font-label">Recommended Fix</span>
                  </div>
                  <p className="text-xs font-bold text-brand-on-surface-variant leading-relaxed">{check.fix}</p>
                </div>
              )}
            </div>
          )}

          {!check.impact && !check.fix && check.detail && (
            <p className="text-xs font-bold text-brand-on-surface-variant leading-relaxed bg-brand-surface-container-low/30 p-4 rounded-2xl border border-brand-outline-variant/20">{check.detail}</p>
          )}

          {check.value != null && (
            <div className="mt-2">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-3 font-label">Extracted Data</p>
              <ValueDisplay value={check.value} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckListByCategory({ checks, category }) {
  const filtered = checks?.filter((c) => c.category === category) || [];
  if (filtered.length === 0) return null;

  const config = categoryConfig[category];
  const passed = filtered.filter((c) => c.status === 'pass').length;
  const failed = filtered.filter((c) => c.status === 'fail').length;

  return (
    <Card padding="none" className="overflow-hidden border-brand-outline-variant/20">
      <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/10 flex justify-between items-center bg-brand-surface-container-low/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
            {config.icon}
          </div>
          <h3 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-tight font-headline">
            {config.label}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{passed} Passed</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{failed} Issues</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">
        {filtered.map((check, i) => (
          <CheckRow key={i} check={check} />
        ))}
      </div>
    </Card>
  );
}

export default function SeoPanel({ siteId }) {
  const { audit, isLoading, scanning, startScanning } = useSeoAudit(siteId);
  const scanMutation = useSeoTrigger(siteId, { onScanStart: startScanning });
  const pageSpeedMutation = usePageSpeedFetch(siteId);
  const [activeStrategy, setActiveStrategy] = useState('mobile');
  const [downloading, setDownloading] = useState(false);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline leading-tight">SEO Deep Audit</h1>
            {audit && <p className="text-xs font-bold text-brand-outline uppercase tracking-widest mt-1">Snapshot: {formatDate(audit.scannedAt)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {audit && (
            <Button
              variant="secondary"
              size="md"
              onClick={async () => {
                setDownloading(true);
                try { await downloadSeoReport(siteId); } catch {} finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="flex-1 sm:flex-none"
            >
              {downloading ? <Spinner size="xs" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {downloading ? 'Preparing...' : 'Export Report'}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => scanMutation.mutate()}
            isLoading={scanMutation.isPending}
            disabled={scanning}
            className="flex-1 sm:flex-none shadow-brand-primary/20"
          >
            {scanning ? 'Auditing...' : 'Start New Audit'}
          </Button>
        </div>
      </div>

      {scanning && <ScanningOverlay />}

      {audit ? (
        <>
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
              <svg className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-brand-on-surface dark:text-brand-outline-variant uppercase tracking-widest font-headline">Overall Optimization Index</h3>
                <Badge variant={audit.score >= 90 ? 'success' : audit.score >= 50 ? 'warning' : 'danger'}>
                  {audit.score >= 90 ? 'Optimized' : audit.score >= 50 ? 'Developing' : 'Critical'}
                </Badge>
              </div>
              <ScoreBar
                score={audit.score}
                totalChecks={audit.totalChecks}
                passedChecks={audit.passedChecks}
                failedChecks={audit.failedChecks}
              />
              {audit.warnChecks > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-500 font-label uppercase tracking-widest">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {audit.warnChecks} Optimization opportunities identified
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CategoryScoreCard
              label="Meta Efficiency"
              icon={categoryConfig['meta-tags'].icon}
              score={audit.metaTagsScore}
              passed={audit.checks?.filter((c) => c.category === 'meta-tags' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'meta-tags').length || 0}
            />
            <CategoryScoreCard
              label="Content Quality"
              icon={categoryConfig.content.icon}
              score={audit.contentScore}
              passed={audit.checks?.filter((c) => c.category === 'content' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'content').length || 0}
            />
            <CategoryScoreCard
              label="Link Integrity"
              icon={categoryConfig.links.icon}
              score={audit.linksScore}
              passed={audit.checks?.filter((c) => c.category === 'links' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'links').length || 0}
            />
            <CategoryScoreCard
              label="UX Performance"
              icon={categoryConfig.performance.icon}
              score={audit.performanceScore}
              passed={audit.checks?.filter((c) => c.category === 'performance' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'performance').length || 0}
            />
          </div>

          {audit.pageSpeed && (audit.pageSpeed.mobile || audit.pageSpeed.desktop) ? (() => {
            const scores = audit.pageSpeed[activeStrategy] || audit.pageSpeed.mobile || audit.pageSpeed.desktop;
            if (!scores) return null;

            return (
              <Card padding="none" className="overflow-hidden border-brand-primary/20 bg-gradient-to-br from-brand-surface-container-lowest to-brand-surface-container-low/30">
                <div className="p-6 border-b border-brand-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-brand-primary/10 rounded-2xl text-brand-primary">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-brand-on-surface dark:text-white font-headline">Lighthouse Technical Vitals</h3>
                      <p className="text-xs font-bold text-brand-outline uppercase tracking-widest mt-0.5">Automated Diagnostics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => pageSpeedMutation.mutate()}
                      disabled={pageSpeedMutation.isPending}
                      className="p-2 rounded-xl text-brand-outline hover:text-brand-primary hover:bg-brand-primary/5 transition-all disabled:opacity-50 border border-brand-outline-variant/30"
                    >
                      <svg className={`w-5 h-5 ${pageSpeedMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <div className="flex p-1 bg-brand-surface-container-high/50 dark:bg-brand-on-surface/20 rounded-2xl border border-brand-outline-variant/30 backdrop-blur-sm">
                      {audit.pageSpeed.mobile && (
                        <button
                          onClick={() => setActiveStrategy('mobile')}
                          className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${ activeStrategy === 'mobile' ? 'bg-brand-surface-container-lowest dark:bg-brand-primary text-brand-primary dark:text-white shadow-md' : 'text-brand-outline hover:text-brand-primary' }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2} /><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={3} strokeLinecap="round" /></svg>
                          Mobile
                        </button>
                      )}
                      {audit.pageSpeed.desktop && (
                        <button
                          onClick={() => setActiveStrategy('desktop')}
                          className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${ activeStrategy === 'desktop' ? 'bg-brand-surface-container-lowest dark:bg-brand-primary text-brand-primary dark:text-white shadow-md' : 'text-brand-outline hover:text-brand-primary' }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={2} /><line x1="8" y1="21" x2="16" y2="21" strokeWidth={2} strokeLinecap="round" /><line x1="12" y1="17" x2="12" y2="21" strokeWidth={2} /></svg>
                          Desktop
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-around flex-wrap gap-8 pb-10 mb-10 border-b border-brand-outline-variant/20">
                    <LighthouseGauge label="Performance" score={scores.performance} />
                    <LighthouseGauge label="Accessibility" score={scores.accessibility} />
                    <LighthouseGauge label="Best Practices" score={scores.bestPractices} />
                    <LighthouseGauge label="SEO Index" score={scores.seo} />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <div className="xl:col-span-5 flex flex-col items-center justify-center space-y-6 bg-brand-surface-container-low/20 p-8 rounded-3xl border border-brand-outline-variant/30">
                      <LighthouseGauge label="Core Web Vitals" score={scores.performance} size="lg" />
                      <ScoreLegend />
                      <p className="text-[10px] font-bold text-brand-outline text-center uppercase tracking-widest leading-relaxed">
                        Metrics represent real-user interaction and visual stability markers.
                      </p>
                    </div>

                    <div className="xl:col-span-7">
                      <h4 className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-6 font-label">Performance Metrics Breakdown</h4>
                      <div className="space-y-1">
                        <MetricRow label="First Contentful Paint" value={scores.fcp} unit="ms" good={1800} poor={3000} />
                        <MetricRow label="Largest Contentful Paint" value={scores.lcp} unit="ms" good={2500} poor={4000} />
                        <MetricRow label="Total Blocking Time" value={scores.tbt} unit="ms" good={200} poor={600} />
                        <MetricRow label="Cumulative Layout Shift" value={scores.cls} unit="" good={0.1} poor={0.25} />
                        <MetricRow label="Speed Index Score" value={scores.si} unit="ms" good={3400} poor={5800} />
                        {(scores.inp != null || scores.ttfb != null || scores.fid != null) && (
                          <div className="pt-6 mt-6 border-t border-brand-outline-variant/20">
                            <h4 className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-4 font-label">Advanced Vitals</h4>
                            <MetricRow label="Interaction to Next Paint" value={scores.inp} unit="ms" good={200} poor={500} />
                            <MetricRow label="Time to First Byte (TTFB)" value={scores.ttfb} unit="ms" good={800} poor={1800} />
                            <MetricRow label="Max Potential FID" value={scores.fid} unit="ms" good={100} poor={300} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })() : scanning ? (
            <div className="py-12 flex flex-col items-center gap-4 bg-brand-surface-container-low/20 rounded-3xl border border-brand-outline-variant/30 border-dashed">
              <Spinner size="lg" />
              <p className="text-sm font-bold text-brand-outline uppercase tracking-widest animate-pulse">
                Awaiting PageSpeed Insights Data...
              </p>
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <div className="text-center py-10">
                <div className="h-16 w-16 bg-brand-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-brand-on-surface mb-2">Technical Vitals Unavailable</h4>
                <p className="text-sm text-brand-outline max-w-sm mx-auto mb-6">
                  PageSpeed Insights provides deep analysis of load performance and accessibility.
                </p>
                {audit?.pageSpeedError && (
                  <div className="bg-red-500/5 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 max-w-md mx-auto border border-red-500/10">
                    {audit.pageSpeedError}
                  </div>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => pageSpeedMutation.mutate()}
                  isLoading={pageSpeedMutation.isPending}
                  className="shadow-brand-primary/20"
                >
                  Fetch Technical Vitals
                </Button>
              </div>
            </Card>
          )}

          <CheckListByCategory checks={audit.checks} category="meta-tags" />
          <CheckListByCategory checks={audit.checks} category="content" />
          <CheckListByCategory checks={audit.checks} category="links" />
          <CheckListByCategory checks={audit.checks} category="performance" />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-brand-surface-container-low/20 rounded-3xl border-2 border-dashed border-brand-outline-variant/30">
          <div className="p-4 bg-brand-surface-container-high rounded-full mb-4">
            <svg className="h-10 w-10 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">No Audit Data Found</h3>
          <p className="text-sm text-brand-outline mt-2 mb-8">Run your first comprehensive SEO audit to identify optimization targets.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => scanMutation.mutate()}
            isLoading={scanMutation.isPending}
          >
            Run Initial Audit
          </Button>
        </div>
      )}
    </div>
  );
}
