import Card from '../common/Card';

export default function KPICards({ sites }) {
  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const degraded = sites.filter((s) => s.currentStatus === 'degraded').length;

  const uptime = total > 0 ? ((up / total) * 100).toFixed(1) : 0;

  const cards = [
    {
      label: 'Fleet Assets',
      value: total,
      sub: 'Total monitored',
      status: 'Active',
      color: 'text-blue-500',
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      glow: 'shadow-blue-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      label: 'Availability',
      value: `${uptime}%`,
      sub: 'Uptime index',
      status: uptime >= 99 ? 'Nominal' : 'Warning',
      color: uptime >= 99 ? 'text-emerald-500' : 'text-amber-500',
      bg: uptime >= 99 ? 'bg-emerald-500/5' : 'bg-amber-500/5',
      border: uptime >= 99 ? 'border-emerald-500/20' : 'border-amber-500/20',
      glow: uptime >= 99 ? 'shadow-emerald-500/10' : 'shadow-amber-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Critical',
      value: down,
      sub: 'Failure states',
      status: down > 0 ? 'Urgent' : 'Stable',
      color: down > 0 ? 'text-rose-500' : 'text-brand-outline',
      bg: down > 0 ? 'bg-rose-500/5' : 'bg-brand-outline/5',
      border: down > 0 ? 'border-rose-500/20' : 'border-brand-outline/10',
      glow: down > 0 ? 'shadow-rose-500/10' : 'shadow-transparent',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Performance',
      value: degraded,
      sub: 'Latency issues',
      status: degraded > 0 ? 'Degraded' : 'Optimal',
      color: degraded > 0 ? 'text-amber-500' : 'text-brand-outline',
      bg: degraded > 0 ? 'bg-amber-500/5' : 'bg-brand-outline/5',
      border: degraded > 0 ? 'border-amber-500/20' : 'border-brand-outline/10',
      glow: degraded > 0 ? 'shadow-amber-500/10' : 'shadow-transparent',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div 
          key={card.label}
          className={`relative group bg-white dark:bg-brand-surface-container-low border ${card.border} rounded-2xl p-5 shadow-sm hover:shadow-md ${card.glow} transition-all duration-300 overflow-hidden`}
        >
          {/* Subtle tech grid background pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${card.bg} ${card.color} border border-current/10`}>
                {card.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-current/20 ${card.color} ${card.bg}`}>
                {card.status}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-brand-on-surface dark:text-white tracking-tighter">
                  {card.value}
                </h3>
                <span className="text-[11px] font-medium text-brand-outline/60 dark:text-brand-on-surface-variant/40 italic">
                  {card.sub}
                </span>
              </div>
            </div>

            {/* Bottom mini gauge indicator */}
            <div className="h-1 w-full bg-brand-surface-container rounded-full overflow-hidden">
              <div className={`h-full bg-current transition-all duration-1000 ${card.color}`} 
                   style={{ width: card.label === 'Fleet Assets' ? '100%' : card.label === 'Availability' ? `${uptime}%` : card.value > 0 ? '100%' : '0%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
