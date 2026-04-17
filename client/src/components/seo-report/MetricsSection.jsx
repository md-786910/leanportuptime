import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { metricBarColor } from './colorThemes';

function dotColor(value, good, poor) {
  if (value <= good) return 'bg-emerald-500';
  if (value <= poor) return 'bg-amber-500';
  return 'bg-red-500';
}

function statusLabel(value, good, poor) {
  if (value <= good) return 'Good';
  if (value <= poor) return 'Needs Improvement';
  return 'Poor';
}

function statusTextColor(value, good, poor) {
  if (value <= good) return 'text-emerald-600 dark:text-emerald-400';
  if (value <= poor) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function formatValue(value, unit) {
  if (unit === 'ms') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
  }
  return value.toFixed(3);
}

const CORE_METRICS = [
  { key: 'fcp', label: 'First Contentful Paint', unit: 'ms', good: 1800, poor: 3000, max: 6000, desc: 'Time until the first text or image is painted.' },
  { key: 'lcp', label: 'Largest Contentful Paint', unit: 'ms', good: 2500, poor: 4000, max: 8000, desc: 'Time until the largest content element is visible.' },
  { key: 'tbt', label: 'Total Blocking Time', unit: 'ms', good: 200, poor: 600, max: 1200, desc: 'Total time the main thread was blocked, preventing input responsiveness.' },
  { key: 'cls', label: 'Cumulative Layout Shift', unit: '', good: 0.1, poor: 0.25, max: 0.5, desc: 'Measures visual stability — how much the page layout shifts during loading.' },
  { key: 'si', label: 'Speed Index', unit: 'ms', good: 3400, poor: 5800, max: 10000, desc: 'How quickly the contents of a page are visibly populated.' },
];

const ADDITIONAL_METRICS = [
  { key: 'inp', label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500, max: 1000, desc: 'Responsiveness to user interactions.' },
  { key: 'ttfb', label: 'Time to First Byte', unit: 'ms', good: 800, poor: 1800, max: 3000, desc: 'Time for the server to send the first byte of the response.' },
  { key: 'fid', label: 'Max Potential FID', unit: 'ms', good: 100, poor: 300, max: 600, desc: 'Worst-case first input delay.' },
];

function MetricBarRow({ metric, value, themeKey, index, expanded }) {
  const { label, unit, good, poor, max, desc } = metric;
  const color = metricBarColor(value, good, poor, themeKey, index);
  const barMax = Math.max(max, value * 1.2);
  const data = [{ name: label, value }];

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor(value, good, poor)}`} />
          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${statusTextColor(value, good, poor)}`}>
            {statusLabel(value, good, poor)}
          </span>
          <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatValue(value, unit)}
          </span>
        </div>
      </div>

      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, barMax]} hide />
            <YAxis type="category" dataKey="name" hide />
            <ReferenceLine x={good} stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />
            <ReferenceLine x={poor} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={12} background={{ fill: '#f3f4f6', radius: 4 }}>
              <Cell fill={color} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-0.5">
        <span>0</span>
        <span className="text-emerald-500">Good ≤ {unit === 'ms' ? formatValue(good, unit) : good}</span>
        <span className="text-red-500">Poor &gt; {unit === 'ms' ? formatValue(poor, unit) : poor}</span>
      </div>

      {expanded && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pl-4.5">{desc}</p>
      )}
    </div>
  );
}

export default function MetricsSection({ scores, themeKey, viewMode }) {
  const [expanded, setExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const effectiveShowDetails = viewMode === 'details' ? true : viewMode === 'charts' ? false : showDetails;

  if (!scores) return null;

  const coreMetrics = CORE_METRICS.filter((m) => scores[m.key] != null);
  const additionalMetrics = ADDITIONAL_METRICS.filter((m) => scores[m.key] != null);

  if (coreMetrics.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 group"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Core Web Vitals
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{coreMetrics.length} metrics</span>
        </button>
        {expanded && !viewMode && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-4">
          {coreMetrics.map((m, i) => (
            <MetricBarRow
              key={m.key}
              metric={m}
              value={scores[m.key]}
              themeKey={themeKey}
              index={i}
              expanded={effectiveShowDetails}
            />
          ))}
        </div>
      )}

      {expanded && additionalMetrics.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Additional Vitals
          </h4>
          <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-4">
            {additionalMetrics.map((m, i) => (
              <MetricBarRow
                key={m.key}
                metric={m}
                value={scores[m.key]}
                themeKey={themeKey}
                index={coreMetrics.length + i}
                expanded={effectiveShowDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
