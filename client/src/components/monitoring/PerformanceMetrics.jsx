import Card from '../common/Card';
import { formatResponseTime } from '../../utils/formatters';

export default function PerformanceMetrics({ summary }) {
  if (!summary) return null;

  const metrics = [
    { label: 'Avg Response', value: formatResponseTime(summary.avgResponseTime) },
    { label: 'Avg TTFB', value: formatResponseTime(summary.avgTtfb) },
    { label: 'Max Response', value: formatResponseTime(summary.maxResponseTime) },
    { label: 'Min Response', value: formatResponseTime(summary.minResponseTime) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} padding="sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{m.label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
        </Card>
      ))}
    </div>
  );
}
