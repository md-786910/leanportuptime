import { format } from 'date-fns';
import Card from '../common/Card';

export default function UptimeBar({ checks, days = 30 }) {
  const buckets = {};
  checks.forEach((c) => {
    const day = format(new Date(c.timestamp), 'yyyy-MM-dd');
    if (!buckets[day]) buckets[day] = { up: 0, down: 0, degraded: 0 };
    buckets[day][c.status] = (buckets[day][c.status] || 0) + 1;
  });

  const today = new Date();
  const bars = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = format(date, 'yyyy-MM-dd');
    const bucket = buckets[key];

    let color = 'bg-brand-surface-container-highest dark:bg-brand-on-surface/20'; // no data
    if (bucket) {
      if (bucket.down > 0) color = 'bg-red-500 shadow-sm shadow-red-500/30';
      else if (bucket.degraded > 0) color = 'bg-amber-500 shadow-sm shadow-amber-500/30';
      else color = 'bg-emerald-500 shadow-sm shadow-emerald-500/30';
    }

    bars.push({ key, color, date: format(date, 'MMM d'), bucket });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-primary/10 rounded-lg text-brand-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[10px] font-black text-brand-on-surface dark:text-brand-outline uppercase tracking-widest font-headline">Operational History ({days}d)</h3>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-brand-outline font-label">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />UP</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />DEGRADED</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />DOWN</span>
        </div>
      </div>
      <div className="flex gap-1 h-12">
        {bars.map((bar) => (
          <div
            key={bar.key}
            className={`flex-1 rounded-md ${bar.color} cursor-pointer transition-all duration-300 hover:scale-y-125 hover:z-10 relative group`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-brand-on-surface text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-20">
              <p className="border-b border-white/10 pb-1 mb-1">{bar.date}</p>
              {bar.bucket ? (
                <div className="space-y-0.5">
                  <p className="text-emerald-400">UP: {bar.bucket.up}</p>
                  {bar.bucket.degraded > 0 && <p className="text-amber-400">DEGRADED: {bar.bucket.degraded}</p>}
                  {bar.bucket.down > 0 && <p className="text-red-400">DOWN: {bar.bucket.down}</p>}
                </div>
              ) : (
                <p className="opacity-60">No Telemetry Recorded</p>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand-on-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
