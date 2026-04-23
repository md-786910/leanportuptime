import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import Card from '../common/Card';

export default function ResponseChart({ checks, height = 300 }) {
  const data = [...checks]
    .reverse()
    .map((c) => ({
      time: new Date(c.timestamp).getTime(),
      responseTime: c.responseTime,
      status: c.status,
    }));

  if (!data.length) {
    return (
      <Card>
        <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-8">No check data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">Response Time</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => format(new Date(t), 'HH:mm')}
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => `${v}ms`}
            stroke="#9ca3af"
            fontSize={12}
          />
          <Tooltip
            labelFormatter={(t) => format(new Date(t), 'MMM d, HH:mm:ss')}
            formatter={(value) => [`${Math.round(value)}ms`, 'Response Time']}
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#responseGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
