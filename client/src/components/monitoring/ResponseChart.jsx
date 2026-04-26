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
      <div className="flex flex-col items-center justify-center py-12 text-brand-outline opacity-40">
        <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm font-bold uppercase tracking-widest font-label">Telemetry unavailable</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => format(new Date(t), 'HH:mm')}
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tickFormatter={(v) => `${v}ms`}
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(t) => format(new Date(t), 'MMM d, HH:mm:ss')}
            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(4px)',
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              color: '#1f2937',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
            itemStyle={{ color: '#6366f1', padding: '0' }}
          />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#responseGrad)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
