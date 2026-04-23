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
          {/* Overall Score */}
          <Card>
            <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Overall Health Score</h3>
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

          {/* Category Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CategoryScoreCard
              label="Performance"
              icon="⚡"
              score={scan.performanceScore}
              passed={scan.checks?.filter((c) => c.category === 'performance' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'performance').length || 0}
            />
            <CategoryScoreCard
              label="Bugs & Issues"
              icon="🐛"
              score={scan.bugsScore}
              passed={scan.checks?.filter((c) => c.category === 'bugs' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'bugs').length || 0}
            />
            <CategoryScoreCard
              label="Malware"
              icon="🛡"
              score={scan.malwareScore}
              passed={scan.checks?.filter((c) => c.category === 'malware' && c.status === 'pass').length || 0}
              total={scan.checks?.filter((c) => c.category === 'malware').length || 0}
            />
          </div>

          {/* Key Metrics */}
          {(scan.responseTime || scan.pageSize || scan.resourceCounts) && (
            <Card>
              <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {scan.responseTime != null && (
                  <div>
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{scan.responseTime}ms</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Response Time</p>
                  </div>
                )}
                {scan.pageSize != null && (
                  <div>
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{Math.round(scan.pageSize / 1024)} KB</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Page Size</p>
                  </div>
                )}
                {scan.resourceCounts?.scripts != null && (
                  <div>
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{scan.resourceCounts.scripts}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Scripts</p>
                  </div>
                )}
                {scan.resourceCounts?.stylesheets != null && (
                  <div>
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{scan.resourceCounts.stylesheets}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Stylesheets</p>
                  </div>
                )}
                {scan.resourceCounts?.images != null && (
                  <div>
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{scan.resourceCounts.images}</p>
                    <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">Images</p>
                  </div>
                )}
              </div>
            </Card>
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
