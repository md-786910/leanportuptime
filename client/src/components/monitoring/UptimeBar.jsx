import { format } from 'date-fns';
import Card from '../common/Card';

export default function UptimeBar({ checks, days = 30 }) {
  // Group checks by day
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

    let color = 'bg-brand-surface-container-high dark:bg-brand-on-surface'; // no data
    if (bucket) {
      if (bucket.down > 0) color = 'bg-red-500';
      else if (bucket.degraded > 0) color = 'bg-amber-500';
      else color = 'bg-emerald-500';
    }

    bars.push({ key, color, date: format(date, 'MMM d'), bucket });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">Uptime ({days} days)</h3>
        <div className="flex items-center gap-3 text-xs text-brand-on-surface-variant font-label">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Up</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Degraded</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Down</span>
        </div>
      </div>
      <div className="flex gap-0.5">
        {bars.map((bar) => (
          <div
            key={bar.key}
            className={`flex-1 h-8 rounded-sm ${bar.color} cursor-pointer transition-opacity hover:opacity-80`}
            title={`${bar.date}: ${bar.bucket ? `Up: ${bar.bucket.up}, Down: ${bar.bucket.down}, Degraded: ${bar.bucket.degraded}` : 'No data'}`}
          />
        ))}
      </div>
    </Card>
  );
}
