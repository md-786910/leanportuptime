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
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h4>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-gray-400 mb-0.5">/ 100</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full ${barColor(score)} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{passed}/{total} checks passed</p>
    </Card>
  );
}

function CheckRow({ check }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = check.detail || check.value;

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700">
      <button
        type="button"
        onClick={() => hasDetail && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${hasDetail ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''} ${expanded ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            check.status === 'pass' ? 'bg-emerald-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-amber-500'
          }`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.check}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{check.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {check.severity && <Badge variant={severityVariant[check.severity]}>{check.severity}</Badge>}
          <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
          {hasDetail && (
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 space-y-2">
          {check.detail && (
            <p className="text-xs text-gray-700 dark:text-gray-300">{check.detail}</p>
          )}
          {check.value != null && typeof check.value === 'object' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Object.entries(check.value).map(([k, v]) => `${k}: ${v}`).join(' | ')}
            </p>
          )}
          {check.value != null && typeof check.value !== 'object' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Value: {check.value}</p>
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
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
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
          {scan && <p className="text-xs text-gray-500 dark:text-gray-400">Last scan: {formatDate(scan.scannedAt)}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
          Run Scan
        </Button>
      </div>

      {scan ? (
        <>
          {/* Overall Score */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Overall Health Score</h3>
            <ScoreBar
              score={scan.score}
              totalChecks={scan.totalChecks}
              passedChecks={scan.passedChecks}
              failedChecks={scan.failedChecks}
            />
            {scan.warnChecks > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{scan.warnChecks} warning(s)</p>
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {scan.responseTime != null && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{scan.responseTime}ms</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Response Time</p>
                  </div>
                )}
                {scan.pageSize != null && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{Math.round(scan.pageSize / 1024)} KB</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Page Size</p>
                  </div>
                )}
                {scan.resourceCounts?.scripts != null && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{scan.resourceCounts.scripts}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Scripts</p>
                  </div>
                )}
                {scan.resourceCounts?.stylesheets != null && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{scan.resourceCounts.stylesheets}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stylesheets</p>
                  </div>
                )}
                {scan.resourceCounts?.images != null && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{scan.resourceCounts.images}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Images</p>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No site scan data. Run a scan to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
