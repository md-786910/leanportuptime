import KpiCard from '../common/KpiCard';
import { formatResponseTime } from '../../utils/formatters';

export default function PerformanceMetrics({ summary }) {
  if (!summary) return null;

  const metrics = [
    { label: 'Avg Response', value: formatResponseTime(summary.avgResponseTime), accent: 'indigo', hint: 'Mean response time' },
    { label: 'Avg TTFB', value: formatResponseTime(summary.avgTtfb), accent: 'blue', hint: 'Time to first byte' },
    { label: 'Max Response', value: formatResponseTime(summary.maxResponseTime), accent: 'rose', hint: 'Slowest request' },
    { label: 'Min Response', value: formatResponseTime(summary.minResponseTime), accent: 'emerald', hint: 'Fastest request' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <KpiCard key={m.label} label={m.label} value={m.value} hint={m.hint} accent={m.accent} />
      ))}
    </div>
  );
}
