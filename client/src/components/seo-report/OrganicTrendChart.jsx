import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { themeColor } from './colorThemes';
import CompareOrganicTrendModal from './CompareOrganicTrendModal';

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function OrganicTrendChart({ trend, themeKey, siteId }) {
  const [compareOpen, setCompareOpen] = useState(false);

  if (!trend || trend.length < 2) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        Not enough data for trend chart.
      </p>
    );
  }

  return (
    <div>
      {/* Organic Traffic Trend */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">
          Organic Traffic Trend
        </h4>
        {siteId && (
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
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <defs>
              <linearGradient id="gaSessionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gaConversionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor(themeKey, 2)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={themeColor(themeKey, 2)} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(d) => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              formatter={(value, name) => {
                if (name === 'sessions') return [formatNumber(value), 'Sessions'];
                if (name === 'conversions') return [formatNumber(value), 'Conversions'];
                return [value, name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="sessions"
              stroke={themeColor(themeKey, 0)}
              strokeWidth={2}
              fill="url(#gaSessionsGrad)"
              name="Sessions"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="conversions"
              stroke={themeColor(themeKey, 2)}
              strokeWidth={2}
              fill="url(#gaConversionsGrad)"
              name="Conversions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {siteId && (
        <CompareOrganicTrendModal
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          siteId={siteId}
          currentTrend={trend}
          currentLabel="Current Period"
        />
      )}
    </div>
  );
}
