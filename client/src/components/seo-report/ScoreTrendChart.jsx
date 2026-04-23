import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { themeColor } from './colorThemes';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ScoreTrendChart({ history, themeKey, strategy }) {
  if (!history || history.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant">
          Not enough data for trend chart. Run more scans to see score trends over time.
        </p>
      </div>
    );
  }

  const colors = {
    performance: themeColor(themeKey, 0),
    accessibility: themeColor(themeKey, 1),
    bestPractices: themeColor(themeKey, 2),
    seo: themeColor(themeKey, 3),
  };

  const chartData = history
    .filter((entry) => entry.pageSpeed)
    .map((entry) => {
      const ps = entry.pageSpeed[strategy] || entry.pageSpeed.mobile || entry.pageSpeed.desktop;
      if (!ps) return null;
      return {
        date: formatDate(entry.scannedAt),
        Performance: ps.performance,
        Accessibility: ps.accessibility,
        'Best Practices': ps.bestPractices,
        SEO: ps.seo,
      };
    })
    .filter(Boolean)
    .reverse();

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant">
          Not enough PageSpeed history to display trends.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">Score Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
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
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Line type="monotone" dataKey="Performance" stroke={colors.performance} strokeWidth={2} dot={{ r: 3, fill: colors.performance }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Accessibility" stroke={colors.accessibility} strokeWidth={2} dot={{ r: 3, fill: colors.accessibility }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Best Practices" stroke={colors.bestPractices} strokeWidth={2} dot={{ r: 3, fill: colors.bestPractices }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="SEO" stroke={colors.seo} strokeWidth={2} dot={{ r: 3, fill: colors.seo }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
