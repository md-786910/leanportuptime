import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import Card from '../common/Card';

export default function TimingBreakdown({ checks }) {
  const data = [...checks]
    .slice(0, 20)
    .reverse()
    .map((c) => ({
      time: format(new Date(c.timestamp), 'HH:mm'),
      DNS: c.dnsTime || 0,
      TLS: c.tlsTime || 0,
      TTFB: c.ttfb || 0,
      Transfer: Math.max(0, (c.responseTime || 0) - (c.ttfb || 0)),
    }));

  if (!data.length) return null;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/20 flex justify-between items-center bg-brand-surface-container-lowest/50">
        <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Latency Timing Breakdown
        </h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="time" 
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
              cursor={{ fill: 'rgba(53, 37, 205, 0.05)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(4px)',
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                color: '#1f2937',
                fontSize: '12px',
                fontWeight: '600'
              }} 
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
            />
            <Bar dataKey="DNS" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="TLS" stackId="a" fill="#818cf8" barSize={20} />
            <Bar dataKey="TTFB" stackId="a" fill="#10b981" barSize={20} />
            <Bar dataKey="Transfer" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
