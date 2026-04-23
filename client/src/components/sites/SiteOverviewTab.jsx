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
    { label: 'Uptime', value: formatUptime(summary?.uptimePercent), color: summary?.uptimePercent >= 99 ? 'text-emerald-600 dark:text-emerald-400' : summary?.uptimePercent >= 95 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400' },
    { label: 'Avg Response', value: formatResponseTime(summary?.avgResponseTime), color: 'text-brand-primary dark:text-brand-400' },
    { label: 'Total Checks', value: summary?.totalChecks || 0, color: 'text-brand-on-surface dark:text-white' },
    { label: 'Downtime Events', value: summary?.downChecks || 0, color: summary?.downChecks > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Max Response', value: formatResponseTime(summary?.maxResponseTime), color: 'text-brand-on-surface dark:text-white' },
    { label: 'Avg TTFB', value: formatResponseTime(summary?.avgTtfb), color: 'text-brand-on-surface dark:text-white' },
  ];

  const recentChecks = checks.slice(0, 5);

  // SSL summary
  const sslData = ssl || site.ssl;
  const sslDays = sslData?.daysRemaining;
  let sslColor = 'text-emerald-600 dark:text-emerald-400';
  let sslBg = 'bg-emerald-50 dark:bg-emerald-900/20';
  if (sslDays != null) {
    if (sslDays <= 0) { sslColor = 'text-red-600 dark:text-red-400'; sslBg = 'bg-red-50 dark:bg-red-900/20'; }
    else if (sslDays <= 14) { sslColor = 'text-amber-600 dark:text-amber-400'; sslBg = 'bg-amber-50 dark:bg-amber-900/20'; }
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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} padding="sm">
            <p className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-wider font-label">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color} font-headline`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Response Chart + Uptime Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ResponseChart checks={checks} height={200} />
        <UptimeBar checks={checks} days={days} />
      </div>

      {/* SSL + Security Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SSL Summary */}
        <Card>
          <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            SSL Certificate
          </h3>
          {sslData?.validTo ? (
            <div className={`rounded-lg p-3 ${sslBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-lg font-bold ${sslColor} font-headline`}>
                  {sslDays > 0 ? 'Valid' : 'Expired'}
                </span>
                <span className={`text-sm font-medium ${sslColor}`}>
                  {formatDaysRemaining(sslDays)} remaining
                </span>
              </div>
              <div className="space-y-1 text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
                <div className="flex justify-between">
                  <span>Issuer</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant">{sslData.issuer || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatDate(sslData.validTo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol</span>
                  <span className="text-brand-on-surface dark:text-brand-outline-variant">{sslData.protocol || '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline py-4 text-center">No SSL data yet</p>
          )}
        </Card>

        {/* Security Summary */}
        <Card>
          <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Score
          </h3>
          {secScore != null ? (
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-bold ${secColor} font-headline`}>{secScore}</span>
                <span className="text-sm text-brand-on-surface-variant dark:text-brand-outline mb-1">/ 100</span>
              </div>
              <div className="w-full h-2 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden mb-3">
                <div className={`h-full ${secBarColor} rounded-full transition-all duration-500`} style={{ width: `${secScore}%` }} />
              </div>
              {audit?.checks && (
                <div className="flex gap-4 text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
                  <span>{audit.checks.filter((c) => c.status === 'pass').length} passed</span>
                  <span>{audit.checks.filter((c) => c.status === 'fail').length} failed</span>
                  <span>{audit.checks.length} total</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline py-4 text-center">No security scan yet</p>
          )}
        </Card>
      </div>

      {/* Recent Checks */}
      {recentChecks.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-brand-outline-variant dark:border-brand-outline">
            <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">Recent Checks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-outline-variant dark:border-brand-outline">
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">Time</th>
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">Status</th>
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">HTTP</th>
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">Response</th>
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">TTFB</th>
                  <th className="text-left py-2 px-4 font-medium text-brand-on-surface-variant text-xs font-label">Location</th>
                </tr>
              </thead>
              <tbody>
                {recentChecks.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 dark:border-brand-outline">
                    <td className="py-2 px-4 text-brand-on-surface dark:text-brand-outline text-xs font-label">{formatRelative(c.timestamp)}</td>
                    <td className="py-2 px-4">
                      <span className={`text-xs font-medium ${ c.status === 'up' ? 'text-emerald-600' : c.status === 'down' ? 'text-red-600' : 'text-amber-600' } font-label`}>{c.status}</span>
                    </td>
                    <td className="py-2 px-4 text-brand-on-surface dark:text-brand-outline">{c.httpStatus || '—'}</td>
                    <td className="py-2 px-4 text-brand-on-surface dark:text-brand-outline">{formatResponseTime(c.responseTime)}</td>
                    <td className="py-2 px-4 text-brand-on-surface dark:text-brand-outline">{formatResponseTime(c.ttfb)}</td>
                    <td className="py-2 px-4">
                      <Badge variant={c.location && c.location !== 'local' ? 'info' : 'neutral'}>{c.location || 'local'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Site Info */}
      <Card>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Site Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">URL</span>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary dark:text-brand-400 hover:underline truncate ml-4">{site.url}</a>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Check Interval</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{intervalLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Last Checked</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatRelative(site.lastCheckedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Monitoring</span>
            <Badge variant={site.paused ? 'warning' : 'success'}>{site.paused ? 'Paused' : 'Active'}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Consecutive Failures</span>
            <span className={site.consecutiveFailures > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-brand-on-surface dark:text-brand-outline-variant'}>{site.consecutiveFailures || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Created</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatDate(site.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Notifications</span>
            <div className="flex gap-1">
              {channels.length > 0 ? channels.map((ch) => (
                <Badge key={ch} variant="info">{ch}</Badge>
              )) : <span className="text-brand-outline text-xs font-label">None configured</span>}
            </div>
          </div>
          {site.tags?.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-brand-on-surface-variant dark:text-brand-outline">Tags</span>
              <div className="flex gap-1">
                {site.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
