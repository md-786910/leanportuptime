import Card from '../common/Card';
import Badge from '../common/Badge';
import ResponseChart from '../monitoring/ResponseChart';
import UptimeBar from '../monitoring/UptimeBar';
import { useSSL } from '../../hooks/useSSL';
import { useSecurity } from '../../hooks/useSecurity';
import { formatResponseTime, formatUptime, formatRelative, formatDate, formatDaysRemaining } from '../../utils/formatters';
import { CHECK_INTERVALS } from '../../utils/constants';

export default function SiteOverviewTab({ site, summary, checks = [], period = '24h' }) {
  const intervalLabel = CHECK_INTERVALS.find((i) => i.value === site.interval)?.label || `${site.interval / 1000}s`;
  const { ssl } = useSSL(site._id);
  const { audit } = useSecurity(site._id);
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;

  const kpis = [
    { 
      label: 'Uptime', 
      value: formatUptime(summary?.uptimePercent), 
      color: summary?.uptimePercent >= 99 ? 'text-emerald-600 dark:text-emerald-400' : summary?.uptimePercent >= 95 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    { 
      label: 'Avg Response', 
      value: formatResponseTime(summary?.avgResponseTime), 
      color: 'text-brand-primary dark:text-brand-primary-fixed-dim',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Total Checks', 
      value: summary?.totalChecks || 0, 
      color: 'text-brand-on-surface dark:text-white',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      label: 'Downtime', 
      value: summary?.downChecks || 0, 
      color: summary?.downChecks > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      label: 'Max Response', 
      value: formatResponseTime(summary?.maxResponseTime), 
      color: 'text-brand-on-surface dark:text-white',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    },
    { 
      label: 'Avg TTFB', 
      value: formatResponseTime(summary?.avgTtfb), 
      color: 'text-brand-on-surface dark:text-white',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4" />
        </svg>
      )
    },
  ];

  const recentChecks = checks.slice(0, 5);

  const sslData = ssl || site.ssl;
  const sslDays = sslData?.daysRemaining;
  let sslColor = 'text-emerald-600 dark:text-emerald-400';
  let sslBg = 'bg-emerald-50/50 dark:bg-emerald-900/10';
  let sslBorder = 'border-emerald-100 dark:border-emerald-900/20';
  if (sslDays != null) {
    if (sslDays <= 0) { 
      sslColor = 'text-red-600 dark:text-red-400'; 
      sslBg = 'bg-red-50/50 dark:bg-red-900/10'; 
      sslBorder = 'border-red-100 dark:border-red-900/20';
    }
    else if (sslDays <= 14) { 
      sslColor = 'text-amber-600 dark:text-amber-400'; 
      sslBg = 'bg-amber-50/50 dark:bg-amber-900/10'; 
      sslBorder = 'border-amber-100 dark:border-amber-900/20';
    }
  }

  const secScore = audit?.score ?? site.securityScore;
  let secColor = 'text-brand-on-surface-variant';
  let secBarColor = 'bg-brand-surface-container-highest';
  if (secScore != null) {
    if (secScore >= 80) { secColor = 'text-emerald-600 dark:text-emerald-400'; secBarColor = 'bg-emerald-500'; }
    else if (secScore >= 50) { secColor = 'text-amber-600 dark:text-amber-400'; secBarColor = 'bg-amber-500'; }
    else { secColor = 'text-red-600 dark:text-red-400'; secBarColor = 'bg-red-500'; }
  }

  const channels = [];
  if (site.notifications?.email?.enabled) channels.push('Email');
  if (site.notifications?.slack?.enabled) channels.push('Slack');
  if (site.notifications?.discord?.enabled) channels.push('Discord');
  if (site.notifications?.webhook?.enabled) channels.push('Webhook');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} padding="md" className="relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-brand-outline uppercase tracking-[0.1em] font-label">{kpi.label}</p>
              <div className="text-brand-outline group-hover:text-brand-primary transition-colors duration-300">
                {kpi.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.color} font-headline leading-tight`}>{kpi.value}</p>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-20" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <Card padding="none" className="h-full overflow-hidden">
            <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/20 flex justify-between items-center bg-brand-surface-container-lowest/50">
              <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Response Time History
              </h3>
            </div>
            <div className="p-5">
              <ResponseChart checks={checks} height={250} />
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card padding="none" className="h-full overflow-hidden">
            <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/20 flex justify-between items-center bg-brand-surface-container-lowest/50">
              <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Uptime Overview
              </h3>
            </div>
            <div className="p-5">
              <UptimeBar checks={checks} days={days} />
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs font-label">
                  <span className="text-brand-outline">Status</span>
                  <Badge variant={site.paused ? 'warning' : 'success'}>{site.paused ? 'Paused' : 'Monitoring'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-label">
                  <span className="text-brand-outline">Interval</span>
                  <span className="font-semibold text-brand-on-surface dark:text-brand-outline-variant">{intervalLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-label">
                  <span className="text-brand-outline">Consecutive Failures</span>
                  <span className={`font-semibold ${site.consecutiveFailures > 0 ? 'text-red-500' : 'text-brand-on-surface dark:text-brand-outline-variant'}`}>
                    {site.consecutiveFailures || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:border-brand-primary/20 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">SSL Certificate</h3>
          </div>
          {sslData?.validTo ? (
            <div className={`rounded-2xl p-4 border ${sslBorder} ${sslBg} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className={`text-2xl font-black ${sslColor} font-headline leading-tight`}>
                    {sslDays > 0 ? 'Protected' : 'Expired'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-brand-outline font-bold mt-1">Status</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${sslColor} block`}>
                    {formatDaysRemaining(sslDays)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-brand-outline font-bold">Remaining</span>
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-brand-outline-variant/20">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-on-surface-variant/70 font-medium">Issuer</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant font-semibold">{sslData.issuer || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-on-surface-variant/70 font-medium">Expires</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant font-semibold">{formatDate(sslData.validTo)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-on-surface-variant/70 font-medium">Protocol</span>
                  <Badge variant="neutral" className="!lowercase">{sslData.protocol || '—'}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-brand-outline">
              <svg className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm font-medium">No SSL data available</p>
            </div>
          )}
        </Card>

        <Card className="hover:border-brand-primary/20 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">Security Health</h3>
          </div>
          {secScore != null ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-black ${secColor} font-headline leading-none`}>{secScore}</span>
                  <span className="text-sm text-brand-outline font-bold mb-1">/100</span>
                </div>
                <div className="text-right">
                  <Badge variant={secScore >= 80 ? 'success' : secScore >= 50 ? 'warning' : 'danger'}>
                    {secScore >= 80 ? 'Excellent' : secScore >= 50 ? 'Needs Work' : 'Critical'}
                  </Badge>
                </div>
              </div>
              <div className="w-full h-3 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full ${secBarColor} rounded-full transition-all duration-1000 ease-out shadow-lg`} 
                  style={{ width: `${secScore}%` }} 
                />
              </div>
              {audit?.checks && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-brand-surface-container-low dark:bg-brand-on-surface/20 p-2 rounded-xl text-center">
                    <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider mb-1">Passed</p>
                    <p className="text-sm font-bold text-emerald-500">{audit.checks.filter((c) => c.status === 'pass').length}</p>
                  </div>
                  <div className="bg-brand-surface-container-low dark:bg-brand-on-surface/20 p-2 rounded-xl text-center">
                    <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider mb-1">Failed</p>
                    <p className="text-sm font-bold text-red-500">{audit.checks.filter((c) => c.status === 'fail').length}</p>
                  </div>
                  <div className="bg-brand-surface-container-low dark:bg-brand-on-surface/20 p-2 rounded-xl text-center">
                    <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-bold text-brand-primary">{audit.checks.length}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-brand-outline">
              <svg className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm font-medium">No security scan performed</p>
            </div>
          )}
        </Card>
      </div>

      {recentChecks.length > 0 && (
        <Card padding="none" className="overflow-hidden border-brand-outline-variant/30">
          <div className="px-5 py-4 border-b border-brand-outline-variant dark:border-brand-outline/20 flex justify-between items-center bg-brand-surface-container-lowest/50">
            <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Monitoring Activity
            </h3>
            <Badge variant="neutral">Live</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface-container-low/30 dark:bg-brand-on-surface/5">
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">Timestamp</th>
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">Status</th>
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">Code</th>
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">Response</th>
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">TTFB</th>
                  <th className="text-left py-3 px-5 font-bold text-brand-outline text-[10px] uppercase tracking-widest font-label">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-outline-variant/10 dark:divide-brand-outline/10">
                {recentChecks.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-surface-container-low/20 dark:hover:bg-brand-on-surface/5 transition-colors">
                    <td className="py-3 px-5 text-brand-on-surface-variant dark:text-brand-outline text-xs font-medium whitespace-nowrap">{formatRelative(c.timestamp)}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${ 
                        c.status === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 
                        c.status === 'down' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 
                        'text-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          c.status === 'up' ? 'bg-emerald-500' : 
                          c.status === 'down' ? 'bg-red-500' : 
                          'bg-amber-500'
                        }`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs font-bold text-brand-on-surface dark:text-brand-outline-variant">{c.httpStatus || '—'}</td>
                    <td className="py-3 px-5 font-semibold text-xs text-brand-on-surface dark:text-brand-outline-variant">{formatResponseTime(c.responseTime)}</td>
                    <td className="py-3 px-5 font-semibold text-xs text-brand-on-surface dark:text-brand-outline-variant">{formatResponseTime(c.ttfb)}</td>
                    <td className="py-3 px-5">
                      <Badge variant={c.location && c.location !== 'local' ? 'brand' : 'neutral'} className="!text-[9px] !px-1.5">{c.location || 'local'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="border-brand-outline-variant/30 bg-gradient-to-br from-brand-surface-container-lowest to-brand-surface-container-low dark:from-brand-on-surface/30 dark:to-brand-on-surface/10">
        <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant mb-4 flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Site Configuration Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Target URL</p>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary dark:text-brand-primary-fixed-dim hover:underline font-semibold block truncate">
              {site.url}
            </a>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Notification Channels</p>
            <div className="flex flex-wrap gap-1.5">
              {channels.length > 0 ? channels.map((ch) => (
                <Badge key={ch} variant="brand" className="!px-1.5 !py-0">{ch}</Badge>
              )) : <span className="text-brand-outline-variant text-xs italic">No channels configured</span>}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Site Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {site.tags?.length > 0 ? site.tags.map((tag) => (
                <Badge key={tag} variant="neutral" className="!px-1.5 !py-0">{tag}</Badge>
              )) : <span className="text-brand-outline-variant text-xs italic">No tags</span>}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Created On</p>
            <p className="text-brand-on-surface dark:text-brand-outline-variant font-semibold">{formatDate(site.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Last Sync</p>
            <p className="text-brand-on-surface dark:text-brand-outline-variant font-semibold">{formatRelative(site.lastCheckedAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-outline font-bold uppercase tracking-wider">Monitor ID</p>
            <p className="text-brand-outline-variant font-mono text-[10px] truncate">{site._id}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
