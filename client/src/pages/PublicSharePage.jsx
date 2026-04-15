import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicShareLayout from '../components/layout/PublicShareLayout';
import SiteDetailTabs from '../components/sites/SiteDetailTabs';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import ResponseChart from '../components/monitoring/ResponseChart';
import UptimeBar from '../components/monitoring/UptimeBar';
import PerformanceMetrics from '../components/monitoring/PerformanceMetrics';
import TimingBreakdown from '../components/monitoring/TimingBreakdown';
import SSLBadge from '../components/ssl/SSLBadge';
import SSLHistoryList from '../components/ssl/SSLHistoryList';
import ScoreBar from '../components/security/ScoreBar';
import SecurityCheckList from '../components/security/SecurityCheckList';
import { formatDate, formatRelative, formatResponseTime, formatUptime } from '../utils/formatters';
import {
  useSharedSite,
  useSharedCheckSummary,
  useSharedChecks,
  useSharedSSL,
  useSharedSecurity,
  useSharedSeo,
  useSharedPlugins,
  useSharedSiteScan,
} from '../hooks/usePublicShare';

const ALL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'ssl', label: 'SSL' },
  { key: 'seo', label: 'SEO' },
  { key: 'security', label: 'Security' },
  { key: 'plugins', label: 'Plugins' },
  { key: 'sitescan', label: 'Site Scan' },
  { key: 'history', label: 'History' },
];

// ========== Section Components ==========

function PublicOverview({ token, site, period }) {
  const { summary } = useSharedCheckSummary(token, period);
  const { checks } = useSharedChecks(token, { limit: 100 });
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Uptime</p>
            <p className="text-2xl font-bold text-emerald-600">{formatUptime(summary.uptimePercent)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Response</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatResponseTime(summary.avgResponseTime)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Checks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalChecks}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Downtime Events</p>
            <p className={`text-2xl font-bold ${summary.downChecks > 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
              {summary.downChecks}
            </p>
          </Card>
        </div>
      )}

      {checks.length > 0 && (
        <>
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Response Times</h3>
            <ResponseChart checks={checks} />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Uptime</h3>
            <UptimeBar checks={checks} days={days} />
          </Card>
        </>
      )}
    </div>
  );
}

function PublicPerformance({ token, period }) {
  const { summary } = useSharedCheckSummary(token, period);
  const { checks } = useSharedChecks(token, { limit: 100 });

  return (
    <div className="space-y-6">
      <PerformanceMetrics summary={summary} />
      <ResponseChart checks={checks} />
      <TimingBreakdown checks={checks} />
    </div>
  );
}

function PublicSSL({ token }) {
  const { ssl, history, isLoading } = useSharedSSL(token);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <SSLBadge ssl={ssl} />
      {ssl && ssl.issuer && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Certificate Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Issuer:</span> <span className="text-gray-900 dark:text-gray-100">{ssl.issuer}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Protocol:</span> <span className="text-gray-900 dark:text-gray-100">{ssl.protocol || '—'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Valid From:</span> <span className="text-gray-900 dark:text-gray-100">{formatDate(ssl.validFrom)}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Valid To:</span> <span className="text-gray-900 dark:text-gray-100">{formatDate(ssl.validTo)}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Cipher:</span> <span className="text-gray-900 dark:text-gray-100">{ssl.cipher || '—'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Fingerprint:</span> <span className="text-gray-900 dark:text-gray-100 text-xs break-all">{ssl.fingerprint || '—'}</span></div>
          </div>
        </Card>
      )}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Certificate History</h3>
        <SSLHistoryList history={history} />
      </Card>
    </div>
  );
}

function PublicSecurity({ token }) {
  const { audit, isLoading } = useSharedSecurity(token);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!audit) {
    return (
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No security audit data available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Security Score</h3>
        <ScoreBar
          score={audit.score}
          totalChecks={audit.totalChecks}
          passedChecks={audit.passedChecks}
          failedChecks={audit.failedChecks}
        />
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Security Checks</h3>
        <SecurityCheckList checks={audit.checks} />
      </Card>
    </div>
  );
}

function PublicSeo({ token }) {
  const { audit, isLoading } = useSharedSeo(token);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!audit) {
    return (
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No SEO audit data available.</p>
      </Card>
    );
  }

  const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };

  return (
    <div className="space-y-6">
      <div>
        {audit.scannedAt && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(audit.scannedAt)}</p>}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Overall SEO Score</h3>
        <ScoreBar
          score={audit.score}
          totalChecks={audit.totalChecks}
          passedChecks={audit.passedChecks}
          failedChecks={audit.failedChecks}
        />
      </Card>
      {audit.checks?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">SEO Checks</h3>
          <div className="space-y-2">
            {audit.checks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    check.status === 'pass' ? 'bg-emerald-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.check}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{check.message}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PublicPlugins({ token }) {
  const { audit, isLoading } = useSharedPlugins(token);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!audit) {
    return (
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No plugin scan data available.</p>
      </Card>
    );
  }

  const statusVariant = { ok: 'success', warn: 'warning', critical: 'danger' };

  return (
    <div className="space-y-6">
      <div>
        {audit.scannedAt && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(audit.scannedAt)}</p>}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{audit.totalPlugins}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Plugins</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{audit.totalPlugins - audit.issueCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Clean</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${audit.issueCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{audit.issueCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Issues</p>
          </div>
        </div>
      </Card>
      {audit.plugins?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Detected Plugins</h3>
          <div className="space-y-2">
            {audit.plugins.map((plugin, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    plugin.status === 'ok' ? 'bg-emerald-500' : plugin.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {plugin.name}
                      {plugin.detectedVersion && <span className="ml-1.5 text-xs text-gray-400 font-normal">v{plugin.detectedVersion}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {plugin.isMalicious && <Badge variant="danger">Malware</Badge>}
                  {plugin.isVulnerable && <Badge variant="warning">Vulnerable</Badge>}
                  <Badge variant={statusVariant[plugin.status]}>{plugin.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PublicSiteScan({ token }) {
  const { scan, isLoading } = useSharedSiteScan(token);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!scan) {
    return (
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No site scan data available.</p>
      </Card>
    );
  }

  const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };

  return (
    <div className="space-y-6">
      <div>
        {scan.scannedAt && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(scan.scannedAt)}</p>}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Overall Health Score</h3>
        <ScoreBar
          score={scan.score}
          totalChecks={scan.totalChecks}
          passedChecks={scan.passedChecks}
          failedChecks={scan.failedChecks}
        />
      </Card>
      {scan.checks?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Checks</h3>
          <div className="space-y-2">
            {scan.checks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    check.status === 'pass' ? 'bg-emerald-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.check}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{check.message}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PublicHistory({ token, period }) {
  const { checks } = useSharedChecks(token, { limit: 100 });
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;

  return (
    <div className="space-y-6">
      <UptimeBar checks={checks} days={days} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">HTTP</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Response</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">TTFB</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c._id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-xs">
                  {new Date(c.timestamp).toLocaleString()}
                </td>
                <td className="py-2 px-3">
                  <span className={`text-xs font-medium ${
                    c.status === 'up' ? 'text-emerald-600'
                      : c.status === 'down' ? 'text-red-600'
                        : 'text-amber-600'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{c.httpStatus || '—'}</td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{c.responseTime ? `${c.responseTime}ms` : '—'}</td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{c.ttfb ? `${c.ttfb}ms` : '—'}</td>
                <td className="py-2 px-3">
                  <Badge variant={c.location && c.location !== 'local' ? 'info' : 'neutral'}>
                    {c.location || 'local'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== Main Page ==========

export default function PublicSharePage() {
  const { token } = useParams();
  const { site, visibleSections, label, isLoading, error } = useSharedSite(token);
  const [activeTab, setActiveTab] = useState(null);
  const [period, setPeriod] = useState('24h');

  if (isLoading) {
    return (
      <PublicShareLayout>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PublicShareLayout>
    );
  }

  if (error) {
    const isExpired = error.response?.status === 401;
    return (
      <PublicShareLayout>
        <div className="text-center py-16">
          <div className="text-4xl mb-4">{isExpired ? '🔒' : '❌'}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isExpired ? 'Link Expired or Revoked' : 'Share Link Not Found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isExpired
              ? 'This share link is no longer active. Please contact the site owner for a new link.'
              : 'The share link you followed does not exist. Please check the URL and try again.'}
          </p>
        </div>
      </PublicShareLayout>
    );
  }

  if (!site) return null;

  const availableTabs = ALL_TABS.filter((t) => visibleSections?.[t.key]);
  const currentTab = activeTab || availableTabs[0]?.key || 'overview';

  return (
    <PublicShareLayout>
      <div className="space-y-6">
        {/* Site Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
            <StatusBadge status={site.currentStatus} />
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {site.url}
          </a>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last checked {formatRelative(site.lastCheckedAt)}
          </p>
        </div>

        {/* Tabs */}
        {availableTabs.length > 1 && (
          <SiteDetailTabs
            activeTab={currentTab}
            onTabChange={setActiveTab}
            tabs={availableTabs}
          />
        )}

        {/* Period selector */}
        {['overview', 'performance', 'history'].includes(currentTab) && (
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {currentTab === 'overview' && <PublicOverview token={token} site={site} period={period} />}
        {currentTab === 'performance' && <PublicPerformance token={token} period={period} />}
        {currentTab === 'ssl' && <PublicSSL token={token} />}
        {currentTab === 'security' && <PublicSecurity token={token} />}
        {currentTab === 'seo' && <PublicSeo token={token} />}
        {currentTab === 'plugins' && <PublicPlugins token={token} />}
        {currentTab === 'sitescan' && <PublicSiteScan token={token} />}
        {currentTab === 'history' && <PublicHistory token={token} period={period} />}
      </div>
    </PublicShareLayout>
  );
}
