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
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Timing Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
          <YAxis tickFormatter={(v) => `${v}ms`} stroke="#9ca3af" fontSize={12} />
          <Tooltip formatter={(value) => `${Math.round(value)}ms`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
          <Legend />
          <Bar dataKey="DNS" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
          <Bar dataKey="TLS" stackId="a" fill="#a78bfa" />
          <Bar dataKey="TTFB" stackId="a" fill="#34d399" />
          <Bar dataKey="Transfer" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
