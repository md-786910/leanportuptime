import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { themeColor } from './colorThemes';

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function OrganicTrendChart({ trend, themeKey }) {
  if (!trend || trend.length < 2) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        Not enough data for trend chart.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">
        Organic Traffic Trend
      </h4>
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
    </div>
  );
}
