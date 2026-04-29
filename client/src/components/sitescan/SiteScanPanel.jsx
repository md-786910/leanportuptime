import { useState } from 'react';
import { useSiteScan, useSiteScanTrigger } from '../../hooks/useSiteScan';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import KpiCard from '../common/KpiCard';
import SectionHeader from '../common/SectionHeader';
import ScoreBar from '../security/ScoreBar';
import { formatDate } from '../../utils/formatters';

function scoreAccent(score) {
  if (score == null) return 'sky';
  if (score >= 80) return 'emerald';
  if (score >= 50) return 'amber';
  return 'rose';
}

const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };
const severityVariant = { low: 'neutral', medium: 'info', high: 'warning', critical: 'danger' };

const categoryConfig = {
  performance: { label: 'Performance', icon: '⚡', color: 'blue' },
  bugs: { label: 'Bugs & Issues', icon: '🐛', color: 'amber' },
  malware: { label: 'Malware & Security', icon: '🛡', color: 'red' },
};

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function barColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function CategoryScoreCard({ label, icon, score, passed, total }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">{label}</h4>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-bold ${scoreColor(score)} font-headline`}>{score}</span>
        <span className="text-xs text-brand-outline mb-0.5 font-label">/ 100</span>
      </div>
      <div className="w-full h-2 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden mb-1.5">
        <div className={`h-full ${barColor(score)} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">{passed}/{total} checks passed</p>
    </Card>
  );
}

function CheckRow({ check }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = check.detail || check.value;

  return (
    <div className="rounded-lg border border-brand-outline-variant dark:border-brand-outline">
      <button
        type="button"
        onClick={() => hasDetail && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${hasDetail ? 'cursor-pointer hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50' : ''} ${expanded ? 'border-b border-brand-outline-variant dark:border-brand-outline' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${ check.status === 'pass' ? 'bg-emerald-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-amber-500' }`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-on-surface dark:text-brand-outline-variant">{check.check}</p>
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline truncate font-label">{check.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {check.severity && <Badge variant={severityVariant[check.severity]}>{check.severity}</Badge>}
          <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
          {hasDetail && (
            <svg className={`w-4 h-4 text-brand-outline transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-brand-surface-container-low/50 dark:bg-brand-on-surface/30 space-y-2">
          {check.detail && (
            <p className="text-xs text-brand-on-surface dark:text-brand-outline font-label">{check.detail}</p>
          )}
          {check.value != null && typeof check.value === 'object' && (
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
              {Object.entries(check.value).map(([k, v]) => `${k}: ${v}`).join(' | ')}
            </p>
          )}
          {check.value != null && typeof check.value !== 'object' && (
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Value: {check.value}</p>
          )}
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
    <Card>
      <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">
        {config.icon} {config.label}
      </h3>
      <div className="space-y-2">
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

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {scan && <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Last scan: {formatDate(scan.scannedAt)}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
          Run Scan
        </Button>
      </div>

      {scan ? (
        <>
          {/* Overall + category scores at a glance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Overall Health" value={scan.score ?? 0} hint={scan.warnChecks > 0 ? `${scan.warnChecks} warning(s)` : `${scan.passedChecks ?? 0}/${scan.totalChecks ?? 0} passed`} accent={scoreAccent(scan.score)} />
            <KpiCard label="Performance" value={scan.performanceScore ?? 0} hint="Speed & rendering" accent={scoreAccent(scan.performanceScore)} />
            <KpiCard label="Bugs & Issues" value={scan.bugsScore ?? 0} hint="JS/HTML errors" accent={scoreAccent(scan.bugsScore)} />
            <KpiCard label="Malware" value={scan.malwareScore ?? 0} hint="Security signals" accent={scoreAccent(scan.malwareScore)} />
          </div>

          <div>
            <SectionHeader number={1} title="Overall Health Score" accent={scoreAccent(scan.score)} description="Aggregate score across all checks" />
            <Card>
              <ScoreBar
                score={scan.score}
                totalChecks={scan.totalChecks}
                passedChecks={scan.passedChecks}
                failedChecks={scan.failedChecks}
              />
              {scan.warnChecks > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-label">{scan.warnChecks} warning(s)</p>
              )}
            </Card>
          </div>

          {/* Key Metrics */}
          {(scan.responseTime || scan.pageSize || scan.resourceCounts) && (
            <div>
              <SectionHeader number={2} title="Key Metrics" accent="blue" description="Response time, payload size and resource counts" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {scan.responseTime != null && (
                  <KpiCard label="Response Time" value={`${scan.responseTime} ms`} accent="indigo" />
                )}
                {scan.pageSize != null && (
                  <KpiCard label="Page Size" value={`${Math.round(scan.pageSize / 1024)} KB`} accent="violet" />
                )}
                {scan.resourceCounts?.scripts != null && (
                  <KpiCard label="Scripts" value={scan.resourceCounts.scripts} accent="amber" />
                )}
                {scan.resourceCounts?.stylesheets != null && (
                  <KpiCard label="Stylesheets" value={scan.resourceCounts.stylesheets} accent="sky" />
                )}
                {scan.resourceCounts?.images != null && (
                  <KpiCard label="Images" value={scan.resourceCounts.images} accent="emerald" />
                )}
              </div>
            </div>
          )}

          {/* Check Lists by Category */}
          <CheckListByCategory checks={scan.checks} category="performance" />
          <CheckListByCategory checks={scan.checks} category="bugs" />
          <CheckListByCategory checks={scan.checks} category="malware" />
        </>
      ) : (
        <Card>
          <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-8">
            No site scan data. Run a scan to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
