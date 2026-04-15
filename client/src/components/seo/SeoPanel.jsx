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
  'meta-tags': { label: 'Meta Tags', icon: '\uD83C\uDFF7\uFE0F' },
  content: { label: 'Content', icon: '\uD83D\uDCDD' },
  links: { label: 'Links', icon: '\uD83D\uDD17' },
  performance: { label: 'Performance', icon: '\u26A1' },
};

const scanningMessages = [
  'Fetching your page...',
  'Analyzing meta tags...',
  'Checking heading structure...',
  'Scanning content quality...',
  'Detecting broken links...',
  'Fetching PageSpeed data...',
  'Calculating scores...',
];

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function barColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function gaugeColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function cwvColor(value, good, poor) {
  if (value <= good) return 'text-emerald-600 dark:text-emerald-400';
  if (value <= poor) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function cwvDotColor(value, good, poor) {
  if (value <= good) return 'bg-emerald-500';
  if (value <= poor) return 'bg-amber-500';
  return 'bg-red-500';
}

// ========== Sub-components ==========

function ScanningOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % scanningMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Analyzing your site...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300">
            {scanningMessages[msgIndex]}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function CategoryScoreCard({ label, icon, score, passed, total }) {
  const noData = total === 0;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h4>
      </div>
      {noData ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No data</p>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
            <span className="text-xs text-gray-400 mb-0.5">/ 100</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full ${barColor(score)} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{passed}/{total} checks passed</p>
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
  const strokeW = isBig ? 7 : 6;
  const fontSize = isBig ? 28 : 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = gaugeColor(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeW} className="text-gray-200 dark:text-gray-700" />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-700"
        />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="central"
          className="font-bold" fill={color} fontSize={fontSize}
        >
          {score}
        </text>
      </svg>
      <span className={`font-medium text-gray-600 dark:text-gray-400 text-center ${isBig ? 'text-sm' : 'text-xs'}`}>{label}</span>
    </div>
  );
}

function MetricRow({ label, value, unit, good, poor }) {
  if (value == null) return null;
  const displayValue = unit === 'ms'
    ? (value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`)
    : value.toFixed(3);

  const dotColor = cwvDotColor(value, good, poor);
  const colorCls = cwvColor(value, good, poor);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${colorCls}`}>{displayValue}</span>
    </div>
  );
}

function ScoreLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-transparent border-b-red-500" />
        <span>0–49</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 bg-amber-500" />
        <span>50–89</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span>90–100</span>
      </div>
    </div>
  );
}

function MiniTable({ rows }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {keys.map((k) => (
              <th key={k} className="px-2.5 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 capitalize">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
              {keys.map((k) => (
                <td key={k} className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300 font-mono">
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
      <span className="font-medium text-gray-500 dark:text-gray-500">{label}:</span>
      <span className="font-mono text-gray-700 dark:text-gray-300">{value}</span>
    </span>
  );
}

function TagList({ items, variant }) {
  const colorMap = {
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };
  const cls = colorMap[variant] || colorMap.neutral;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${cls}`}>{item}</span>
      ))}
    </div>
  );
}

function ValueDisplay({ value }) {
  if (value == null) return null;

  // Primitive
  if (typeof value !== 'object') {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        <ValuePill label="value" value={value} />
      </div>
    );
  }

  // Top-level array
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === 'object') return <MiniTable rows={value} />;
    return <TagList items={value.map(String)} variant="neutral" />;
  }

  // Object — render each key intelligently
  const entries = Object.entries(value);
  const primitiveEntries = [];
  const complexEntries = [];

  for (const [k, v] of entries) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      complexEntries.push([k, v]);
    } else if (typeof v === 'object') {
      complexEntries.push([k, v]);
    } else {
      primitiveEntries.push([k, v]);
    }
  }

  return (
    <div className="space-y-2 mt-1">
      {/* Primitive key-value pills */}
      {primitiveEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {primitiveEntries.map(([k, v]) => (
            <ValuePill key={k} label={k} value={v} />
          ))}
        </div>
      )}

      {/* Complex entries: arrays and nested objects */}
      {complexEntries.map(([k, v]) => {
        // Array of objects → mini table with label
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
          return (
            <div key={k}>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{k}</p>
              <MiniTable rows={v} />
            </div>
          );
        }

        // Array of primitives → tag list with label
        if (Array.isArray(v)) {
          if (v.length === 0) return null;
          const variant = k === 'missing' || k === 'brokenPaths' ? 'danger'
            : k === 'found' ? 'success'
            : 'neutral';
          return (
            <div key={k}>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{k}</p>
              <TagList items={v.map(String)} variant={variant} />
            </div>
          );
        }

        // Nested object → pills
        if (typeof v === 'object' && v !== null) {
          return (
            <div key={k}>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{k}</p>
              <div className="flex flex-wrap gap-1.5">
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

  const borderAccent = isFail
    ? 'border-l-red-500'
    : isWarn
      ? 'border-l-amber-500'
      : 'border-l-emerald-500';

  return (
    <div className={`rounded-lg border border-gray-100 dark:border-gray-700 border-l-[3px] ${borderAccent}`}>
      <button
        type="button"
        onClick={() => hasExpandable && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${hasExpandable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            isPass ? 'bg-emerald-500' : isFail ? 'bg-red-500' : 'bg-amber-500'
          }`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.check}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{check.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {check.severity && <Badge variant={severityVariant[check.severity]}>{check.severity}</Badge>}
          <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
          {hasExpandable && (
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Structured impact + fix for fail/warn */}
          {(check.impact || check.fix) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {check.impact && (
                <div className={`rounded-lg p-3 ${
                  isFail
                    ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                    : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isFail ? 'text-red-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${isFail ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      Impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{check.impact}</p>
                </div>
              )}
              {check.fix && (
                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      How to Fix
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{check.fix}</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback: legacy detail field */}
          {!check.impact && !check.fix && check.detail && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{check.detail}</p>
          )}

          {/* Value display */}
          {check.value != null && <ValueDisplay value={check.value} />}
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
  const warned = filtered.filter((c) => c.status === 'warn').length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {config.icon} {config.label}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {passed > 0 && <span className="text-emerald-600 dark:text-emerald-400">{passed} passed</span>}
          {failed > 0 && <span className="text-red-600 dark:text-red-400">{failed} failed</span>}
          {warned > 0 && <span className="text-amber-600 dark:text-amber-400">{warned} warning</span>}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((check, i) => (
          <CheckRow key={i} check={check} />
        ))}
      </div>
    </Card>
  );
}

// ========== Main Component ==========

export default function SeoPanel({ siteId, readOnly = false, auditData: externalAudit }) {
  const { audit: fetchedAudit, isLoading, scanning, startScanning } = useSeoAudit(readOnly ? null : siteId);
  const scanMutation = useSeoTrigger(readOnly ? null : siteId, { onScanStart: startScanning });
  const pageSpeedMutation = usePageSpeedFetch(readOnly ? null : siteId);
  const [activeStrategy, setActiveStrategy] = useState('mobile');
  const [downloading, setDownloading] = useState(false);

  const audit = externalAudit ?? fetchedAudit;

  if (!readOnly && isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {audit && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(audit.scannedAt)}</p>}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {audit && (
              <button
                onClick={async () => {
                  setDownloading(true);
                  try { await downloadSeoReport(siteId); } catch {} finally { setDownloading(false); }
                }}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {downloading ? (
                  <Spinner size="xs" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {downloading ? 'Generating...' : 'Download Report'}
              </button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scanMutation.mutate()}
              isLoading={scanMutation.isPending}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Run SEO Audit'}
            </Button>
          </div>
        )}
      </div>

      {/* Scanning Overlay */}
      {!readOnly && scanning && <ScanningOverlay />}

      {audit ? (
        <>
          {/* Overall Score */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Overall SEO Score</h3>
            <ScoreBar
              score={audit.score}
              totalChecks={audit.totalChecks}
              passedChecks={audit.passedChecks}
              failedChecks={audit.failedChecks}
            />
            {audit.warnChecks > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{audit.warnChecks} warning(s)</p>
            )}
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CategoryScoreCard
              label="Meta Tags"
              icon={categoryConfig['meta-tags'].icon}
              score={audit.metaTagsScore}
              passed={audit.checks?.filter((c) => c.category === 'meta-tags' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'meta-tags').length || 0}
            />
            <CategoryScoreCard
              label="Content"
              icon={categoryConfig.content.icon}
              score={audit.contentScore}
              passed={audit.checks?.filter((c) => c.category === 'content' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'content').length || 0}
            />
            <CategoryScoreCard
              label="Links"
              icon={categoryConfig.links.icon}
              score={audit.linksScore}
              passed={audit.checks?.filter((c) => c.category === 'links' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'links').length || 0}
            />
            <CategoryScoreCard
              label="Performance"
              icon={categoryConfig.performance.icon}
              score={audit.performanceScore}
              passed={audit.checks?.filter((c) => c.category === 'performance' && c.status === 'pass').length || 0}
              total={audit.checks?.filter((c) => c.category === 'performance').length || 0}
            />
          </div>

          {/* PageSpeed Insights — Google-style layout */}
          {audit.pageSpeed && (audit.pageSpeed.mobile || audit.pageSpeed.desktop) ? (() => {
            const scores = audit.pageSpeed[activeStrategy] || audit.pageSpeed.mobile || audit.pageSpeed.desktop;
            if (!scores) return null;

            return (
              <Card>
                {/* Header with Mobile/Desktop toggle */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Diagnose performance issues</h3>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <button
                        onClick={() => pageSpeedMutation.mutate()}
                        disabled={pageSpeedMutation.isPending}
                        title="Re-fetch PageSpeed data"
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <svg className={`w-4 h-4 ${pageSpeedMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    {audit.pageSpeed.mobile && (
                      <button
                        onClick={() => setActiveStrategy('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          activeStrategy === 'mobile'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" /><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" /></svg>
                        Mobile
                      </button>
                    )}
                    {audit.pageSpeed.desktop && (
                      <button
                        onClick={() => setActiveStrategy('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          activeStrategy === 'desktop'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" /><line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" /></svg>
                        Desktop
                      </button>
                    )}
                  </div>
                  </div>
                </div>

                {/* Lighthouse Score Gauges */}
                <div className="flex justify-around flex-wrap gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                  <LighthouseGauge label="Performance" score={scores.performance} size="sm" />
                  <LighthouseGauge label="Accessibility" score={scores.accessibility} size="sm" />
                  <LighthouseGauge label="Best Practices" score={scores.bestPractices} size="sm" />
                  <LighthouseGauge label="SEO" score={scores.seo} size="sm" />
                </div>

                {/* Performance deep-dive: large gauge + metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                  {/* Left: big performance gauge + legend */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LighthouseGauge label="Performance" score={scores.performance} size="lg" />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[220px]">
                      Values are estimated and may vary. The performance score is calculated directly from these metrics.
                    </p>
                    <ScoreLegend />
                  </div>

                  {/* Right: metrics list */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Metrics</h4>
                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-3">
                      <MetricRow label="First Contentful Paint" value={scores.fcp} unit="ms" good={1800} poor={3000} />
                      <MetricRow label="Largest Contentful Paint" value={scores.lcp} unit="ms" good={2500} poor={4000} />
                      <MetricRow label="Total Blocking Time" value={scores.tbt} unit="ms" good={200} poor={600} />
                      <MetricRow label="Cumulative Layout Shift" value={scores.cls} unit="" good={0.1} poor={0.25} />
                      <MetricRow label="Speed Index" value={scores.si} unit="ms" good={3400} poor={5800} />
                    </div>
                  </div>
                </div>

                {/* Additional Web Vitals */}
                {(scores.inp != null || scores.ttfb != null || scores.fid != null) && (
                  <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional Vitals</h4>
                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-3">
                      <MetricRow label="Interaction to Next Paint (INP)" value={scores.inp} unit="ms" good={200} poor={500} />
                      <MetricRow label="Time to First Byte (TTFB)" value={scores.ttfb} unit="ms" good={800} poor={1800} />
                      <MetricRow label="Max Potential FID" value={scores.fid} unit="ms" good={100} poor={300} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })() : scanning ? (
            <Card>
              <div className="flex items-center justify-center gap-2 py-6">
                <Spinner size="sm" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fetching PageSpeed Insights...
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  PageSpeed Insights not available.
                </p>
                {audit?.pageSpeedError && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-mono max-w-lg mx-auto">
                    {audit.pageSpeedError}
                  </p>
                )}
                <button
                  onClick={() => pageSpeedMutation.mutate()}
                  disabled={pageSpeedMutation.isPending}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pageSpeedMutation.isPending ? (
                    <>
                      <Spinner size="xs" />
                      Fetching PageSpeed data...
                    </>
                  ) : (
                    'Fetch PageSpeed Data'
                  )}
                </button>
              </div>
            </Card>
          )}

          {/* Check Lists by Category */}
          <CheckListByCategory checks={audit.checks} category="meta-tags" />
          <CheckListByCategory checks={audit.checks} category="content" />
          <CheckListByCategory checks={audit.checks} category="links" />
          <CheckListByCategory checks={audit.checks} category="performance" />
        </>
      ) : (
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No SEO audit data. Run an audit to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
