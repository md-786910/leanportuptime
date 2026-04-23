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
          <p className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-wider font-label">{m.label}</p>
          <p className="text-xl font-bold text-brand-on-surface dark:text-white mt-1 font-headline">{m.value}</p>
        </Card>
      ))}
    </div>
  );
}
