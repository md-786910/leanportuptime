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
    <div className="rounded-lg border border-brand-outline-variant dark:border-brand-outline">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${hasDetails ? 'cursor-pointer hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50' : ''} ${expanded ? 'border-b border-brand-outline-variant dark:border-brand-outline' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${ plugin.status === 'ok' ? 'bg-emerald-500' : plugin.status === 'critical' ? 'bg-red-500' : 'bg-amber-500' }`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-on-surface dark:text-brand-outline-variant">
              {plugin.name}
              {plugin.detectedVersion && <span className="ml-1.5 text-xs text-brand-outline font-normal font-label">v{plugin.detectedVersion}</span>}
            </p>
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline truncate font-label">
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
            <span className="text-xs text-brand-outline font-label">WP {plugin.wpCompatibility}</span>
          )}
          <Badge variant={statusVariant[plugin.status]}>{statusLabel[plugin.status]}</Badge>
          {hasDetails && (
            <svg className={`w-4 h-4 text-brand-outline transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-brand-surface-container-low/50 dark:bg-brand-on-surface/30">
          {plugin.isMalicious && plugin.malwareFindings?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 font-label">Malware Findings</p>
              <ul className="space-y-1">
                {plugin.malwareFindings.map((finding, j) => (
                  <li key={j} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5 font-label">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.isVulnerable && plugin.vulnerabilities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 font-label">Known Vulnerabilities</p>
              <ul className="space-y-1.5">
                {plugin.vulnerabilities.map((vuln, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs font-label">
                    <Badge variant={severityVariant[vuln.severity] || 'neutral'} className="flex-shrink-0 mt-0.5">
                      {vuln.severity}
                    </Badge>
                    <span className="text-brand-on-surface dark:text-brand-outline">{vuln.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.solution && plugin.solution !== 'No issues detected.' && (
            <div className="pt-1 border-t border-brand-outline-variant dark:border-brand-outline">
              <p className="text-xs font-semibold text-brand-on-surface-variant dark:text-brand-outline mb-1 font-label">Recommendation</p>
              <p className="text-xs text-brand-on-surface dark:text-brand-outline font-label">{plugin.solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PluginList({ plugins }) {
  if (!plugins?.length) {
    return <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-4">No plugins detected</p>;
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
          {audit && <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Last scan: {formatDate(audit.scannedAt)}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
          Run Scan
        </Button>
      </div>

      {audit ? (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">Summary</h3>
            </div>
            {(() => {
              const malwareCount = audit.plugins?.filter(p => p.isMalicious).length || 0;
              const vulnCount = audit.plugins?.filter(p => p.isVulnerable).length || 0;
              const cleanCount = audit.totalPlugins - audit.issueCount;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{audit.totalPlugins}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Total Plugins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600 font-headline">{cleanCount}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Clean</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${vulnCount > 0 ? 'text-amber-600' : 'text-brand-outline'} font-headline`}>{vulnCount}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Vulnerable</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${malwareCount > 0 ? 'text-red-600' : 'text-brand-outline'} font-headline`}>{malwareCount}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Malware</p>
                  </div>
                </div>
              );
            })()}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Detected Plugins</h3>
            <PluginList plugins={audit.plugins} />
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-8">
            No plugin scan data. Run a scan to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
