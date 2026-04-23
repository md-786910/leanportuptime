import Card from '../common/Card';

export default function KPICards({ sites }) {
  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const degraded = sites.filter((s) => s.currentStatus === 'degraded').length;

  const getPercentage = (value) => (total > 0 ? (value / total) * 100 : 0);

  const cards = [
    {
      label: 'Total Infrastructure',
      value: total,
      sublabel: 'Monitored Endpoints',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-brand-primary dark:text-brand-400',
      bgColor: 'bg-brand-primary',
      accent: 'border-brand-500',
      iconBg: 'bg-brand-50 dark:bg-brand-400/10',
      percent: 100,
    },
    {
      label: 'Operational',
      value: up,
      sublabel: 'Healthy Status',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500',
      accent: 'border-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-400/10',
      percent: getPercentage(up),
    },
    {
      label: 'Critical',
      value: down,
      sublabel: 'Down / Inactive',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500',
      accent: 'border-rose-500',
      iconBg: 'bg-rose-50 dark:bg-rose-400/10',
      percent: getPercentage(down),
    },
    {
      label: 'Degraded',
      value: degraded,
      sublabel: 'High Latency',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      accent: 'border-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-400/10',
      percent: getPercentage(degraded),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`group relative overflow-hidden transition-all duration-300 border-l-4 ${card.accent}`}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className={`h-8 w-8 rounded-xl ${card.iconBg} flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <h3 className="text-3xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
                {card.value}
              </h3>
            </div>

            <div className="space-y-1">
              
              <div>
                <p className="text-[13px] font-bold text-brand-on-surface dark:text-brand-outline-variant">
                  {card.label}
                </p>
                <p className="text-[11px] font-medium text-brand-outline dark:text-brand-on-surface-variant font-label">
                  {card.sublabel}
                </p>
              </div>
            </div>

            {/* Subtle Progress Bar */}
            <div className="h-1 w-full bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-full overflow-hidden">
              <div
                className={`h-full ${card.bgColor} transition-all duration-1000 ease-out`}
                style={{ width: `${card.percent}%` }}
              />
            </div>
          </div>
          
          {/* Decorative element */}
          <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-3xl opacity-10 ${card.bgColor}`} />
        </Card>
      ))}
    </div>
  );
}
