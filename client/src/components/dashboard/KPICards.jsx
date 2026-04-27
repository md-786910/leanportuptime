import Card from '../common/Card';

export default function KPICards({ sites }) {
  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const degraded = sites.filter((s) => s.currentStatus === 'degraded').length;

  const getPercentage = (value) => (total > 0 ? (value / total) * 100 : 0);
  const uptime = total > 0 ? ((up / total) * 100).toFixed(1) : 0;

  const cards = [
    {
      label: 'Fleet Overview',
      value: total,
      sublabel: 'Monitored Assets',
      change: 'Active',
      trend: 'stable',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500',
      accent: 'border-blue-500/20 dark:border-blue-500/30',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      lightBg: 'bg-blue-50/30 dark:bg-blue-500/5',
      percent: 100,
    },
    {
      label: 'Availability',
      value: `${uptime}%`,
      sublabel: 'Aggregate Uptime',
      change: uptime >= 99 ? 'Healthy' : 'Suboptimal',
      trend: uptime >= 99 ? 'up' : 'down',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500',
      accent: 'border-emerald-500/20 dark:border-emerald-500/30',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      lightBg: 'bg-emerald-50/30 dark:bg-emerald-500/5',
      percent: getPercentage(up),
    },
    {
      label: 'Critical Failures',
      value: down,
      sublabel: 'Immediate Action',
      change: down > 0 ? `${down} Down` : 'Zero',
      trend: down > 0 ? 'down' : 'stable',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500',
      accent: 'border-rose-500/20 dark:border-rose-500/30',
      iconBg: 'bg-rose-50 dark:bg-rose-500/10',
      lightBg: 'bg-rose-50/30 dark:bg-rose-500/5',
      percent: getPercentage(down),
    },
    {
      label: 'System Load',
      value: degraded,
      sublabel: 'Latency/Degraded',
      change: degraded > 0 ? 'Warning' : 'Nominal',
      trend: degraded > 0 ? 'down' : 'stable',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      accent: 'border-amber-500/20 dark:border-amber-500/30',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      lightBg: 'bg-amber-50/30 dark:bg-amber-500/5',
      percent: getPercentage(degraded),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`group relative overflow-hidden transition-all duration-300 border-2 ${card.accent} hover:shadow-xl dark:shadow-none hover:-translate-y-1 ${card.lightBg}`}
          padding="lg"
        >
          {/* Subtle animated light effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex flex-col gap-6 relative z-10">
            {/* Header with Icon and Trend Badge */}
            <div className="flex items-start justify-between">
              <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.color} shadow-sm border border-white/20 dark:border-white/5`}>
                {card.icon}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                card.trend === 'down' 
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                  : card.trend === 'stable' 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {card.change}
              </div>
            </div>

            {/* Value Section */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.25em]">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-bold text-brand-on-surface dark:text-white tracking-tighter font-headline">
                  {card.value}
                </h3>
              </div>
              <p className="text-[11px] font-bold text-brand-outline/70 dark:text-brand-on-surface-variant/70 italic">
                {card.sublabel}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-brand-surface-container-high dark:bg-white/5 rounded-full overflow-hidden border border-brand-outline-variant/10">
                <div
                  className={`h-full ${card.bgColor} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${card.percent}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Decorative background shape */}
          <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-10 ${card.bgColor} group-hover:scale-150 transition-transform duration-700`} />
        </Card>
      ))}
    </div>
  );
}
