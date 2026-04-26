import { useState } from 'react';
import { useSiteScan, useSiteScanTrigger } from '../../hooks/useSiteScan';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import ScoreBar from '../security/ScoreBar';
import { formatDate } from '../../utils/formatters';

const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };
const severityVariant = { low: 'neutral', medium: 'info', high: 'warning', critical: 'danger' };

const categoryConfig = {
  performance: { label: 'Efficiency', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ), color: 'emerald' },
  bugs: { label: 'Stability', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), color: 'amber' },
  malware: { label: 'Security', icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ), color: 'red' },
};

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function barColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function CategoryScoreCard({ label, icon, score, passed, total }) {
  return (
    <Card className="hover:border-brand-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-brand-surface-container-high dark:bg-brand-on-surface/20 rounded-xl text-brand-primary">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-brand-outline uppercase tracking-widest">Health Index</span>
      </div>
      <h4 className="text-sm font-black text-brand-on-surface-variant mb-3 font-headline uppercase tracking-tight">{label}</h4>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-3xl font-black ${scoreColor(score)} font-headline`}>{score}</span>
        <span className="text-xs font-bold text-brand-outline">/100</span>
      </div>
      <div className="w-full h-2 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden mb-3 shadow-inner">
        <div className={`h-full ${barColor(score)} rounded-full transition-all duration-1000 ease-out shadow-lg shadow-current/20`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold font-label uppercase text-brand-outline">
        <span>Optimization</span>
        <span>{passed} / {total} Passed</span>
      </div>
    </Card>
  );
}

function CheckRow({ check }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = check.detail || check.value;
  const isPass = check.status === 'pass';

  return (
    <div className={`group rounded-2xl border transition-all duration-300 ${
      expanded ? 'border-brand-primary bg-brand-surface-container-low/20 shadow-lg' : 'border-brand-outline-variant/30 hover:border-brand-primary/30'
    }`}>
      <button
        type="button"
        onClick={() => hasDetail && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-left ${hasDetail ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isPass ? 'bg-emerald-500/10 text-emerald-500' : check.status === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {isPass ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-brand-on-surface dark:text-white font-headline leading-tight">{check.check}</p>
            <p className="text-xs font-semibold text-brand-outline truncate font-label mt-0.5">{check.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {check.severity && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
              check.severity === 'high' || check.severity === 'critical' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-brand-outline border-brand-outline/20'
            }`}>
              {check.severity}
            </span>
          )}
          <Badge variant={statusVariant[check.status]} className="shadow-sm">{check.status}</Badge>
          {hasDetail && (
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
          <div className="rounded-2xl p-4 bg-brand-surface-container-lowest/50 border border-brand-outline-variant/30">
            {check.detail && (
              <p className="text-xs font-bold text-brand-on-surface-variant leading-relaxed">{check.detail}</p>
            )}
            {check.value != null && (
              <div className="mt-3 flex flex-wrap gap-2">
                {typeof check.value === 'object' ? (
                  Object.entries(check.value).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface-container-low/50 dark:bg-brand-on-surface/20 border border-brand-outline-variant/30 text-[10px] font-bold text-brand-on-surface dark:text-brand-outline">
                      <span className="text-brand-outline uppercase tracking-wider">{k}</span>
                      <span className="font-mono">{String(v)}</span>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface-container-low/50 border border-brand-outline-variant/30 text-[10px] font-bold text-brand-on-surface">
                    <span className="text-brand-outline uppercase tracking-wider">RESULT</span>
                    <span className="font-mono">{String(check.value)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckListByCategory({ checks, category }) {
  const filtered = checks?.filter((c) => c.category === category) || [];
  if (filtered.length === 0) return null;

  const config = categoryConfig[category];

  return (
    <Card padding="none" className="overflow-hidden border-brand-outline-variant/30 shadow-xl">
      <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/10 flex justify-between items-center bg-brand-surface-container-low/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
            {config.icon}
          </div>
          <h3 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-widest font-headline">
            {config.label} Analysis
          </h3>
        </div>
        <Badge variant="neutral" className="!text-[9px] uppercase tracking-widest font-black">{filtered.length} CHECKS</Badge>
      </div>
      <div className="p-5 space-y-4">
        {filtered.map((check, i) => (
          <CheckRow key={i} check={check} />
        ))}
      </div>
    </Card>
  );
}

export default function SiteScanPanel({ siteId }) {
  const { scan, isLoading } = useSiteScan(siteId);
  const scanMutation = useSiteScanTrigger(siteId);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-brand-surface-container-low/30 p-5 rounded-3xl border border-brand-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-brand-primary/20">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-on-surface dark:text-white font-headline leading-tight uppercase tracking-tight">Technical forensic Scan</h2>
            {scan && <p className="text-[10px] font-bold text-brand-outline uppercase tracking-widest mt-1">Snapshot captured: {formatDate(scan.scannedAt)}</p>}
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
          Trigger Forensic Scan
        </Button>
      </div>

      {scan ? (
        <div className="grid grid-cols-1 gap-8">
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
              <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 11l-8 3 8-10 8 10-8-3v9z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-brand-on-surface dark:text-brand-outline uppercase tracking-[0.2em] mb-6 font-label">Aggregate Optimization Score</h3>
              <ScoreBar
                score={scan.score}
                totalChecks={scan.totalChecks}
                passedChecks={scan.passedChecks}
                failedChecks={scan.failedChecks}
              />
              {scan.warnChecks > 0 && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-500 font-label uppercase tracking-widest">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {scan.warnChecks} Optimization recommendations identified
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <CategoryScoreCard
              label={categoryConfig.performance.label}
              icon={categoryConfig.performance.icon}
              score={scan.performanceScore}
              passed={scan.checks?.filter((c) => c.category === 'performance' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'performance').length || 0}
            />
            <CategoryScoreCard
              label={categoryConfig.bugs.label}
              icon={categoryConfig.bugs.icon}
              score={scan.bugsScore}
              passed={scan.checks?.filter((c) => c.category === 'bugs' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'bugs').length || 0}
            />
            <CategoryScoreCard
              label={categoryConfig.malware.label}
              icon={categoryConfig.malware.icon}
              score={scan.malwareScore}
              passed={scan.checks?.filter((c) => c.category === 'malware' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'malware').length || 0}
            />
          </div>

          {(scan.responseTime || scan.pageSize || scan.resourceCounts) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {scan.responseTime != null && (
                <Card padding="md" className="border-brand-outline-variant/30">
                  <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-1 font-label">Latency</p>
                  <p className="text-xl font-black text-brand-on-surface dark:text-white font-headline">{scan.responseTime}ms</p>
                </Card>
              )}
              {scan.pageSize != null && (
                <Card padding="md" className="border-brand-outline-variant/30">
                  <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-1 font-label">Payload</p>
                  <p className="text-xl font-black text-brand-on-surface dark:text-white font-headline">{Math.round(scan.pageSize / 1024)} KB</p>
                </Card>
              )}
              <Card padding="md" className="border-brand-outline-variant/30">
                <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-1 font-label">Scripts</p>
                <p className="text-xl font-black text-brand-on-surface dark:text-white font-headline">{scan.resourceCounts?.scripts || 0}</p>
              </Card>
              <Card padding="md" className="border-brand-outline-variant/30">
                <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-1 font-label">Styles</p>
                <p className="text-xl font-black text-brand-on-surface dark:text-white font-headline">{scan.resourceCounts?.stylesheets || 0}</p>
              </Card>
              <Card padding="md" className="border-brand-outline-variant/30">
                <p className="text-[10px] font-black text-brand-outline uppercase tracking-widest mb-1 font-label">Assets</p>
                <p className="text-xl font-black text-brand-on-surface dark:text-white font-headline">{scan.resourceCounts?.images || 0}</p>
              </Card>
            </div>
          )}

          <div className="space-y-8">
            <CheckListByCategory checks={scan.checks} category="performance" />
            <CheckListByCategory checks={scan.checks} category="bugs" />
            <CheckListByCategory checks={scan.checks} category="malware" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-brand-surface-container-low/20 rounded-3xl border-2 border-dashed border-brand-outline-variant/30">
          <div className="p-4 bg-brand-surface-container-high rounded-full mb-4">
            <svg className="h-12 w-12 text-brand-outline opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">Forensic Intelligence Unavailable</h3>
          <p className="text-sm text-brand-outline mt-2 mb-8 max-w-xs text-center">Initiate a deep scan to evaluate page efficiency, structural integrity, and security compliance.</p>
          <Button variant="primary" size="lg" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
            Run Forensic Scan
          </Button>
        </div>
      )}
    </div>
  );
}
