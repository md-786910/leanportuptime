import { useMemo } from 'react';
import { formatRelative } from '../../utils/formatters';

export default function AlertsFeed({ sites }) {
  const alerts = useMemo(() => {
    const list = [];
    sites.forEach(site => {
      // Add status alerts
      if (site.currentStatus === 'down') {
        list.push({
          id: `down-${site._id}`,
          type: 'error',
          title: 'Connection Lost',
          message: `${site.name} is currently unreachable.`,
          time: site.lastCheckedAt || new Date(),
          siteId: site._id
        });
      } else if (site.currentStatus === 'degraded') {
        list.push({
          id: `degraded-${site._id}`,
          type: 'warning',
          title: 'High Latency',
          message: `${site.name} is responding slowly.`,
          time: site.lastCheckedAt || new Date(),
          siteId: site._id
        });
      }

      // Add security alerts
      if (site.plugins?.issueCount > 0) {
        list.push({
          id: `vuln-${site._id}`,
          type: 'security',
          title: 'Vulnerability Found',
          message: `${site.plugins.issueCount} plugins require updates on ${site.name}.`,
          time: site.plugins.lastScannedAt || new Date(),
          siteId: site._id
        });
      }

      // Add SSL alerts
      if (site.ssl?.daysRemaining < 7) {
        list.push({
          id: `ssl-${site._id}`,
          type: 'warning',
          title: 'SSL Expiring',
          message: `Certificate for ${site.name} expires in ${site.ssl.daysRemaining} days.`,
          time: new Date(),
          siteId: site._id
        });
      }
    });

    return list.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  }, [sites]);

  return (
    <div className="bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant/30 rounded-xl p-4 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-brand-on-surface dark:text-white tracking-widest flex items-center gap-2">
          System Alerts
          {alerts.length > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </h3>
        <span className="text-[10px] font-bold text-brand-outline tracking-wider bg-brand-surface-container px-2 py-0.5 rounded-md">
          Live Sync
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="flex gap-4 p-3 rounded-2xl hover:bg-brand-surface-container-lowest transition-colors border border-transparent hover:border-brand-outline-variant/20 group">
              <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                alert.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                alert.type === 'security' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                {alert.type === 'error' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                {alert.type === 'security' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                {alert.type === 'warning' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="text-xs font-black text-brand-on-surface dark:text-white uppercase tracking-tight">{alert.title}</h4>
                  <span className="text-[9px] font-bold text-brand-outline uppercase tracking-tighter whitespace-nowrap opacity-60">
                    {formatRelative(alert.time)}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-brand-outline leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">
                  {alert.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">No Alerts Flagged</span>
          </div>
        )}
      </div>
      
      <button className="mt-6 w-full py-2 rounded-xl bg-brand-surface-container hover:bg-brand-surface-container-high text-[10px] font-black text-brand-outline uppercase tracking-widest transition-colors border border-brand-outline-variant/10">
        View All Records
      </button>
    </div>
  );
}
