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
    <div className={`group rounded-2xl border transition-all duration-300 ${
      expanded ? 'border-brand-primary bg-brand-surface-container-low/20 shadow-lg' : 'border-brand-outline-variant/30 hover:border-brand-primary/30'
    }`}>
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-left ${hasDetails ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            plugin.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : plugin.status === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-brand-on-surface dark:text-white font-headline truncate leading-none">{plugin.name}</p>
              {plugin.detectedVersion && <span className="text-[10px] font-bold text-brand-outline bg-brand-surface-container-high px-1.5 py-0.5 rounded uppercase tracking-tighter">v{plugin.detectedVersion}</span>}
            </div>
            <p className="text-[10px] font-bold text-brand-outline uppercase tracking-widest mt-1.5 font-label truncate">
              {plugin.isClosed ? 'DEPRECATED' : plugin.latestVersion ? `Latest: v${plugin.latestVersion}` : 'COMMERCIAL'}
              {plugin.activeInstalls != null && ` · ${plugin.activeInstalls.toLocaleString()} Installs`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <div className="hidden md:flex gap-1.5">
            {plugin.isMalicious && <Badge variant="danger" className="!px-1.5 !text-[9px]">MALWARE</Badge>}
            {plugin.isVulnerable && <Badge variant="warning" className="!px-1.5 !text-[9px]">VULN</Badge>}
          </div>
          <Badge variant={statusVariant[plugin.status]} className="shadow-sm">{statusLabel[plugin.status]}</Badge>
          {hasDetails && (
            <div className={`p-1 rounded-full transition-all duration-300 bg-brand-surface-container-high ${expanded ? 'rotate-180 bg-brand-primary text-white' : 'text-brand-outline group-hover:text-brand-primary'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-brand-outline-variant/10 dark:bg-brand-outline/10" />
          
          {plugin.isMalicious && plugin.malwareFindings?.length > 0 && (
            <div className="rounded-2xl p-4 bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 font-label flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Malware Detection Findings
              </p>
              <ul className="space-y-2">
                {plugin.malwareFindings.map((finding, j) => (
                  <li key={j} className="text-xs font-bold text-red-700/80 dark:text-red-400/80 flex items-start gap-2 leading-relaxed">
                    <span className="h-1 w-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.isVulnerable && plugin.vulnerabilities?.length > 0 && (
            <div className="rounded-2xl p-4 bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 font-label flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Documented Vulnerabilities
              </p>
              <ul className="space-y-3">
                {plugin.vulnerabilities.map((vuln, j) => (
                  <li key={j} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityVariant[vuln.severity] || 'neutral'} className="!text-[8px] !px-1.5 !py-0">{vuln.severity}</Badge>
                      <span className="text-xs font-black text-brand-on-surface-variant leading-tight">{vuln.title}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugin.solution && plugin.solution !== 'No issues detected.' && (
            <div className="rounded-2xl p-4 bg-brand-surface-container-low/30 border border-brand-outline-variant/30">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">Recommended Action</p>
              <p className="text-xs font-bold text-brand-on-surface-variant leading-relaxed">{plugin.solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PluginList({ plugins }) {
  if (!plugins?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-brand-outline opacity-40">
        <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm font-bold uppercase tracking-widest font-label">No plugins identified</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plugins.map((plugin, i) => (
        <PluginRow key={i} plugin={plugin} />
      ))}
    </div>
  );
}

export default function PluginPanel({ siteId }) {
  const { audit, isLoading } = usePlugins(siteId);
  const scanMutation = usePluginScan(siteId);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-brand-surface-container-low/30 p-5 rounded-3xl border border-brand-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-on-surface dark:text-white font-headline leading-tight uppercase tracking-tight">Plugin Ecosystem Audit</h2>
            {audit && <p className="text-[10px] font-bold text-brand-outline uppercase tracking-widest mt-1">Deep analysis finalized: {formatDate(audit.scannedAt)}</p>}
          </div>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          onClick={() => scanMutation.mutate()} 
          isLoading={scanMutation.isPending}
          className="w-full sm:w-auto shadow-brand-primary/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rescan Plugins
        </Button>
      </div>

      {audit ? (
        <div className="grid grid-cols-1 gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" className="relative overflow-hidden group">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">Ecosystem Size</p>
              <p className="text-3xl font-black text-brand-on-surface-variant font-headline">{audit.totalPlugins}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary/10" />
            </Card>
            <Card padding="md" className="relative overflow-hidden group">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">Validated Clean</p>
              <p className="text-3xl font-black text-emerald-500 font-headline">{audit.totalPlugins - audit.issueCount}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20" />
            </Card>
            <Card padding="md" className="relative overflow-hidden group">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">Known Vulnerabilities</p>
              <p className={`text-3xl font-black ${audit.plugins?.filter(p => p.isVulnerable).length > 0 ? 'text-amber-500' : 'text-brand-outline'} font-headline`}>
                {audit.plugins?.filter(p => p.isVulnerable).length || 0}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/20" />
            </Card>
            <Card padding="md" className="relative overflow-hidden group">
              <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">Critical Malware</p>
              <p className={`text-3xl font-black ${audit.plugins?.filter(p => p.isMalicious).length > 0 ? 'text-red-500' : 'text-brand-outline'} font-headline`}>
                {audit.plugins?.filter(p => p.isMalicious).length || 0}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500/20" />
            </Card>
          </div>

          <Card padding="none" className="overflow-hidden border-brand-outline-variant/30 shadow-xl">
            <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/10 flex justify-between items-center bg-brand-surface-container-low/20">
              <h3 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-widest font-headline">Installed Components Inventory</h3>
              <Badge variant="neutral" className="!text-[9px]">{audit.totalPlugins} Detected</Badge>
            </div>
            <div className="p-5">
              <PluginList plugins={audit.plugins} />
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-brand-surface-container-low/20 rounded-3xl border-2 border-dashed border-brand-outline-variant/30">
          <div className="p-4 bg-brand-surface-container-high rounded-full mb-4">
            <svg className="h-12 w-12 text-brand-outline opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">Ecosystem Analysis Pending</h3>
          <p className="text-sm text-brand-outline mt-2 mb-8 max-w-xs text-center">Analyze installed plugins to detect security vulnerabilities and malicious code.</p>
          <Button variant="primary" size="lg" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
            Initialize Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
