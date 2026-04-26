import Card from '../common/Card';
import { formatResponseTime } from '../../utils/formatters';

export default function PerformanceMetrics({ summary }) {
  if (!summary) return null;

  const metrics = [
    { 
      label: 'Avg Response', 
      value: formatResponseTime(summary.avgResponseTime),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-brand-primary'
    },
    { 
      label: 'Avg TTFB', 
      value: formatResponseTime(summary.avgTtfb),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-500'
    },
    { 
      label: 'Max Response', 
      value: formatResponseTime(summary.maxResponseTime),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
      color: 'text-amber-500'
    },
    { 
      label: 'Min Response', 
      value: formatResponseTime(summary.minResponseTime),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      color: 'text-indigo-500'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} padding="md" className="group hover:border-brand-primary/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl bg-brand-surface-container-high dark:bg-brand-on-surface/20 ${m.color} transition-colors group-hover:bg-brand-primary/10`}>
              {m.icon}
            </div>
            <span className="text-[10px] font-bold text-brand-outline uppercase tracking-widest">Real-time</span>
          </div>
          <div>
            <p className="text-xs font-bold text-brand-on-surface-variant/70 uppercase tracking-wider font-label mb-1">{m.label}</p>
            <p className="text-2xl font-black text-brand-on-surface dark:text-white font-headline leading-tight">{m.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
