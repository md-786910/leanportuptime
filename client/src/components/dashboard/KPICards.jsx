export default function KPICards({ statusCounts = {} }) {
  const { up = 0, down = 0, degraded = 0, pending = 0 } = statusCounts;
  const total = up + down + degraded + pending;
  const pct = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

  const stats = [
    { label: 'Total sites', value: total, hint: 'Monitored endpoints', dot: 'bg-brand-primary' },
    { label: 'Operational', value: up, hint: `${pct(up)}% healthy`, dot: 'bg-emerald-500', bar: 'bg-emerald-500', percent: pct(up) },
    { label: 'Down', value: down, hint: down ? 'Needs attention' : 'All clear', dot: 'bg-rose-500', bar: 'bg-rose-500', percent: pct(down), alert: down > 0 },
    { label: 'Degraded', value: degraded, hint: 'High latency', dot: 'bg-amber-500', bar: 'bg-amber-500', percent: pct(degraded) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-brand-inverse-surface border border-brand-outline-variant/60 dark:border-white/10 rounded-xl shadow-card overflow-hidden">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`p-5 sm:p-6 border-slate-100 dark:border-white/5
            ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${s.dot} ${s.alert ? 'animate-pulse' : ''}`} />
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 font-label">{s.label}</p>
          </div>
          <p className={`mt-3 text-3xl font-semibold tracking-tight font-headline tabular-nums ${s.alert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {s.value}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {s.bar ? (
              <div className="h-1 flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} rounded-full transition-all duration-700`} style={{ width: `${s.percent}%` }} />
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <p className="text-[12px] text-slate-400 font-label whitespace-nowrap">{s.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
