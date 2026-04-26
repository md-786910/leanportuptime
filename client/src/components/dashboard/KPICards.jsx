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
      label: 'Total Infrastructure',
      value: total,
      sublabel: 'Monitored Endpoints',
      change: '+12%',
      trend: 'up',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500',
      accent: 'border-blue-500/30',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      lightBg: 'bg-blue-50/50 dark:bg-blue-500/5',
      percent: 100,
    },
    {
      label: 'System Uptime',
      value: `${uptime}%`,
      sublabel: 'Overall Availability',
      change: '+2.3%',
      trend: 'up',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500',
      accent: 'border-emerald-500/30',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      lightBg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
      percent: getPercentage(up),
    },
    {
      label: 'Critical Issues',
      value: down,
      sublabel: 'Requiring Attention',
      change: down > 0 ? '+1' : 'Resolved',
      trend: down > 0 ? 'down' : 'stable',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500',
      accent: 'border-rose-500/30',
      iconBg: 'bg-rose-50 dark:bg-rose-500/10',
      lightBg: 'bg-rose-50/50 dark:bg-rose-500/5',
      percent: getPercentage(down),
    },
    {
      label: 'Performance',
      value: degraded,
      sublabel: 'Degraded Status',
      change: '-0.5%',
      trend: 'up',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      accent: 'border-amber-500/30',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      lightBg: 'bg-amber-50/50 dark:bg-amber-500/5',
      percent: getPercentage(degraded),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`group relative overflow-hidden transition-all duration-300 border ${card.accent} hover:border-opacity-100 ${card.lightBg}`}
          padding="lg"
        >
          {/* Animated background gradient */}
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${card.bgColor} 0%, transparent 100%)` }} />
          
          <div className="flex flex-col gap-5 relative z-10">
            {/* Header with Icon */}
            <div className="flex items-start justify-between">
              <div className={`h-10 w-10 rounded-lg ${card.iconBg} flex items-center justify-center ${card.color} shadow-sm`}>
                {card.icon}
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-label flex items-center gap-1 ${card.trend === 'down' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                <svg className={`h-3 w-3 ${card.trend === 'down' ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5-5m5 5H6" />
                </svg>
                {card.change}
              </div>
            </div>

            {/* Value and Label */}
            <div className='flex justify-between items-center'>
              <div className="space-y-1">
                <p className="text-[12px] font-bold text-brand-on-surface dark:text-brand-outline-variant uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-[11px] font-medium text-brand-outline dark:text-brand-on-surface-variant font-label">
                  {card.sublabel}
                </p>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline mb-2">
                {card.value}
              </h3>
            </div>

            {/* Enhanced Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-widest">Capacity</span>
                <span className="text-[10px] font-bold text-brand-on-surface dark:text-brand-outline-variant">{card.percent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-brand-surface-container-low dark:bg-brand-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full ${card.bgColor} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                  style={{ width: `${card.percent}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Decorative corner element */}
          <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-5 ${card.bgColor} group-hover:opacity-10 transition-opacity duration-500`} />
        </Card>
      ))}
    </div>
  );
}
