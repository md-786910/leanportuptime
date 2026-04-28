import Badge from '../common/Badge';
import ResponseChart from '../monitoring/ResponseChart';
import UptimeBar from '../monitoring/UptimeBar';
import { useSSL } from '../../hooks/useSSL';
import { useSecurity } from '../../hooks/useSecurity';
import { formatResponseTime, formatUptime, formatRelative, formatDate, formatDaysRemaining } from '../../utils/formatters';
import { CHECK_INTERVALS } from '../../utils/constants';

function StatCard({ label, value, colorClass, icon }) {
  return (
    <div className="bg-brand-surface-container-lowest p-5 rounded-xl shadow-sm border border-brand-outline-variant/20 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-widest leading-tight w-2/3">{label}</span>
        {icon && <span className={`material-symbols-outlined ${colorClass || 'text-brand-outline'}`}>{icon}</span>}
      </div>
      <div>
        <span className={`text-2xl font-black font-headline ${colorClass || 'text-brand-on-surface'}`}>{value}</span>
      </div>
    </div>
  );
}

export default function SiteOverviewTab({ site, summary, checks = [], period = '24h' }) {
  const intervalLabel = CHECK_INTERVALS.find((i) => i.value === site.interval)?.label || `${site.interval / 1000}s`;
  const { ssl } = useSSL(site._id);
  const { audit } = useSecurity(site._id);
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;

  const kpis = [
    { label: 'Uptime', value: formatUptime(summary?.uptimePercent), color: summary?.uptimePercent >= 99 ? 'text-emerald-600 dark:text-emerald-400' : summary?.uptimePercent >= 95 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400', icon: 'power' },
    { label: 'Avg Response', value: formatResponseTime(summary?.avgResponseTime), color: 'text-brand-primary dark:text-brand-400', icon: 'speed' },
    { label: 'Total Checks', value: summary?.totalChecks || 0, color: 'text-brand-on-surface dark:text-white', icon: 'fact_check' },
    { label: 'Downtime Events', value: summary?.downChecks || 0, color: summary?.downChecks > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', icon: 'warning' },
    { label: 'Max Response', value: formatResponseTime(summary?.maxResponseTime), color: 'text-brand-on-surface dark:text-white', icon: 'trending_up' },
    { label: 'Avg TTFB', value: formatResponseTime(summary?.avgTtfb), color: 'text-brand-on-surface dark:text-white', icon: 'dns' },
  ];

  const recentChecks = checks.slice(0, 5);

  // SSL summary
  const sslData = ssl || site.ssl;
  const sslDays = sslData?.daysRemaining;
  let sslColor = 'text-emerald-600 dark:text-emerald-400';
  let sslBg = 'bg-emerald-500/10';
  let sslIcon = 'lock';
  if (sslDays != null) {
    if (sslDays <= 0) { sslColor = 'text-red-600 dark:text-red-400'; sslBg = 'bg-red-500/10'; sslIcon = 'lock_open'; }
    else if (sslDays <= 14) { sslColor = 'text-amber-600 dark:text-amber-400'; sslBg = 'bg-amber-500/10'; sslIcon = 'lock_clock'; }
  }

  // Security summary
  const secScore = audit?.score ?? site.securityScore;
  let secColor = 'text-brand-on-surface-variant';
  let secBarColor = 'bg-brand-surface-container-highest';
  if (secScore != null) {
    if (secScore >= 80) { secColor = 'text-emerald-600 dark:text-emerald-400'; secBarColor = 'bg-emerald-500'; }
    else if (secScore >= 50) { secColor = 'text-amber-600 dark:text-amber-400'; secBarColor = 'bg-amber-500'; }
    else { secColor = 'text-red-600 dark:text-red-400'; secBarColor = 'bg-red-500'; }
  }

  // Notification channels
  const channels = [];
  if (site.notifications?.email?.enabled) channels.push('Email');
  if (site.notifications?.slack?.enabled) channels.push('Slack');
  if (site.notifications?.discord?.enabled) channels.push('Discord');
  if (site.notifications?.webhook?.enabled) channels.push('Webhook');

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} colorClass={kpi.color} icon={kpi.icon} />
        ))}
      </div>

      {/* Response Chart + Uptime Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ResponseChart checks={checks} height={200} />
        <UptimeBar checks={checks} days={days} />
      </div>

      {/* SSL + Security Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* SSL Summary */}
        <div className="bg-brand-surface-container-lowest p-6 rounded-xl shadow-sm border border-brand-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sslBg}`}>
              <span className={`material-symbols-outlined ${sslColor}`}>{sslIcon}</span>
            </div>
            <h3 className="text-sm font-bold font-headline text-brand-on-surface dark:text-brand-outline-variant tracking-wide uppercase">
              SSL Certificate
            </h3>
          </div>
          
          {sslData?.validTo ? (
            <div>
              <div className="flex items-end justify-between mb-4">
                <span className={`text-2xl font-black font-headline ${sslColor}`}>
                  {sslDays > 0 ? 'Valid' : 'Expired'}
                </span>
                <span className={`text-sm font-bold uppercase tracking-wider ${sslColor}`}>
                  {formatDaysRemaining(sslDays)} left
                </span>
              </div>
              <div className="space-y-3 pt-4 border-t border-brand-outline-variant/20 text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Issuer</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant font-medium">{sslData.issuer || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Expires</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant font-medium">{formatDate(sslData.validTo)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Protocol</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant font-medium">{sslData.protocol || '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
               <p className="text-xs font-bold text-brand-outline uppercase tracking-wider">No SSL data yet</p>
            </div>
          )}
        </div>

        {/* Security Summary */}
        <div className="bg-brand-surface-container-lowest p-6 rounded-xl shadow-sm border border-brand-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-surface-container-high dark:bg-brand-on-surface/50">
                <span className="material-symbols-outlined text-brand-on-surface-variant">security</span>
             </div>
            <h3 className="text-sm font-bold font-headline text-brand-on-surface dark:text-brand-outline-variant tracking-wide uppercase">
              Security Score
            </h3>
          </div>
          {secScore != null ? (
            <div>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-4xl font-black font-headline ${secColor}`}>{secScore}</span>
                <span className="text-sm font-bold text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-widest mb-1">/ 100</span>
              </div>
              <div className="w-full h-2 bg-brand-surface-container-low dark:bg-brand-on-surface rounded-full overflow-hidden mb-5">
                <div className={`h-full ${secBarColor} rounded-full transition-all duration-500`} style={{ width: `${secScore}%` }} />
              </div>
              {audit?.checks && (
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant dark:text-brand-outline font-label pt-4 border-t border-brand-outline-variant/20">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{audit.checks.filter((c) => c.status === 'pass').length} passed</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>{audit.checks.filter((c) => c.status === 'fail').length} failed</span>
                  <span>{audit.checks.length} total</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="text-xs font-bold text-brand-outline uppercase tracking-wider">No security scan yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Checks */}
        {recentChecks.length > 0 && (
          <div className="bg-brand-surface-container-lowest rounded-xl shadow-sm border border-brand-outline-variant/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-surface-container bg-brand-surface-container-lowest">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-on-surface-variant font-label">Recent Checks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-surface-container-low border-b-0">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Time</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">HTTP</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-surface-container">
                  {recentChecks.map((c) => (
                    <tr key={c._id} className="hover:bg-brand-surface-container-low/50 transition-colors">
                      <td className="px-6 py-3 text-brand-on-surface dark:text-brand-outline text-xs font-medium tabular-nums">{formatRelative(c.timestamp)}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${ c.status === 'up' ? 'text-emerald-600' : c.status === 'down' ? 'text-red-600' : 'text-amber-600' } font-label`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-3 text-brand-on-surface dark:text-brand-outline text-xs tabular-nums font-medium">{c.httpStatus || '—'}</td>
                      <td className="px-6 py-3 text-brand-on-surface dark:text-brand-outline text-xs tabular-nums text-right font-medium">{formatResponseTime(c.responseTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Site Info */}
        <div className="bg-brand-surface-container-lowest p-6 rounded-xl shadow-sm border border-brand-outline-variant/20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-on-surface-variant mb-4 font-label">Site Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium">
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">URL</span>
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary dark:text-brand-400 hover:underline truncate ml-4 font-bold">{site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Interval</span>
              <span className="text-brand-on-surface dark:text-brand-outline-variant">{intervalLabel}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Last Check</span>
              <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatRelative(site.lastCheckedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Monitoring</span>
              <Badge variant={site.paused ? 'warning' : 'success'}>{site.paused ? 'Paused' : 'Active'}</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Fails</span>
              <span className={site.consecutiveFailures > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-brand-on-surface dark:text-brand-outline-variant'}>{site.consecutiveFailures || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-brand-outline-variant/10">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Created</span>
              <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatDate(site.createdAt)}</span>
            </div>
            <div className="col-span-1 sm:col-span-2 flex justify-between items-center py-1">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Channels</span>
              <div className="flex gap-2">
                {channels.length > 0 ? channels.map((ch) => (
                  <Badge key={ch} variant="info">{ch}</Badge>
                )) : <span className="text-brand-outline text-[10px] font-bold uppercase tracking-wider">None configured</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
