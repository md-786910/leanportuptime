export default function KPIStats({ sites }) {
  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const degraded = sites.filter((s) => s.currentStatus === 'degraded').length;

  const getPercentage = (value) => (total > 0 ? (value / total) * 100 : 0);
  const uptime = total > 0 ? ((up / total) * 100).toFixed(1) : 0;

  const stats = [
    {
      label: 'Total Infrastructure',
      value: total,
      sublabel: 'Monitored Endpoints',
      accent: 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/5',
      icon: '🖥️',
    },
    {
      label: 'System Uptime',
      value: `${uptime}%`,
      sublabel: 'Overall Availability',
      accent: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-500/5',
      icon: '✓',
    },
    {
      label: 'Critical Issues',
      value: down,
      sublabel: 'Requiring Attention',
      accent: 'border-l-rose-500 bg-rose-50 dark:bg-rose-500/5',
      icon: '⚠️',
    },
    {
      label: 'Degraded Status',
      value: degraded,
      sublabel: 'Performance Issues',
      accent: 'border-l-amber-500 bg-amber-50 dark:bg-amber-500/5',
      icon: '⚡',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`border-l-4 ${stat.accent} p-5 rounded-lg transition-all hover:shadow-md duration-200`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-outline-variant dark:text-brand-on-surface-variant uppercase tracking-widest">
                {stat.label}
              </p>
              <h3 className="text-4xl md:text-5xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline mt-2 mb-1">
                {stat.value}
              </h3>
              <p className="text-xs font-medium text-brand-outline dark:text-brand-on-surface-variant">
                {stat.sublabel}
              </p>
            </div>
            <div className="text-3xl flex-shrink-0">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
