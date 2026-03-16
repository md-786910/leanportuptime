import { useState } from 'react';
import { usePlugins, usePluginScan } from '../../hooks/usePlugins';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import { formatDate, formatRelative } from '../../utils/formatters';

const statusVariant = { ok: 'success', warn: 'warning', critical: 'danger' };
const statusLabel = { ok: 'OK', warn: 'Warning', critical: 'Critical' };
const severityVariant = { critical: 'danger', high: 'danger', medium: 'warning', low: 'info' };

function PluginRow({ plugin }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = plugin.isMalicious || plugin.isVulnerable || (plugin.solution && plugin.solution !== 'No issues detected.');

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${hasDetails ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''} ${expanded ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            plugin.status === 'ok' ? 'bg-emerald-500' : plugin.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
          }`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {plugin.name}
              {plugin.detectedVersion && <span className="ml-1.5 text-xs text-gray-400 font-normal">v{plugin.detectedVersion}</span>}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {plugin.isClosed && 'Closed/Deprecated'}
              {!plugin.isClosed && plugin.latestVersion && `Latest: v${plugin.latestVersion}`}
              {plugin.activeInstalls != null && ` · ${plugin.activeInstalls.toLocaleString()} installs`}
              {plugin.lastUpdated && ` · Updated ${formatRelative(plugin.lastUpdated)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {plugin.isMalicious && <Badge variant="danger">Malware</Badge>}
          {plugin.isVulnerable && <Badge variant="warning">Vulnerable</Badge>}
          {plugin.wpCompatibility && (
            <span className="text-xs text-gray-400">WP {plugin.wpCompatibility}</span>
          )}
          <Badge variant={statusVariant[plugin.status]}>{statusLabel[plugin.status]}</Badge>
          {hasDetails && (
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
          {plugin.isMalicious && plugin.malwareFindings?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Malware Findings</p>
              <ul className="space-y-1">
                {plugin.malwareFindings.map((finding, j) => (
                  <li key={j} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.isVulnerable && plugin.vulnerabilities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Known Vulnerabilities</p>
              <ul className="space-y-1.5">
                {plugin.vulnerabilities.map((vuln, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs">
                    <Badge variant={severityVariant[vuln.severity] || 'neutral'} className="flex-shrink-0 mt-0.5">
                      {vuln.severity}
                    </Badge>
                    <span className="text-gray-700 dark:text-gray-300">{vuln.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.solution && plugin.solution !== 'No issues detected.' && (
            <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Recommendation</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{plugin.solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PluginList({ plugins }) {
  if (!plugins?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No plugins detected</p>;
  }

  return (
    <div className="space-y-2">
      {plugins.map((plugin, i) => (
        <PluginRow key={i} plugin={plugin} />
      ))}
    </div>
  );
}

export default function PluginPanel({ siteId }) {
  const { audit, isLoading } = usePlugins(siteId);
  const scanMutation = usePluginScan(siteId);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {audit && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(audit.scannedAt)}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
          Run Scan
        </Button>
      </div>

      {audit ? (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
            </div>
            {(() => {
              const malwareCount = audit.plugins?.filter(p => p.isMalicious).length || 0;
              const vulnCount = audit.plugins?.filter(p => p.isVulnerable).length || 0;
              const cleanCount = audit.totalPlugins - audit.issueCount;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{audit.totalPlugins}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Plugins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{cleanCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clean</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${vulnCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{vulnCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vulnerable</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${malwareCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{malwareCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Malware</p>
                  </div>
                </div>
              );
            })()}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Detected Plugins</h3>
            <PluginList plugins={audit.plugins} />
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No plugin scan data. Run a scan to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
