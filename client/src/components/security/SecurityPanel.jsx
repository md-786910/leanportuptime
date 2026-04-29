import { useSecurity, useSecurityScan } from '../../hooks/useSecurity';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import KpiCard from '../common/KpiCard';
import SectionHeader from '../common/SectionHeader';
import ScoreBar from './ScoreBar';
import SecurityCheckList from './SecurityCheckList';
import { formatDate } from '../../utils/formatters';

function scoreAccent(score) {
  if (score == null) return 'sky';
  if (score >= 80) return 'emerald';
  if (score >= 50) return 'amber';
  return 'rose';
}

export default function SecurityPanel({ siteId }) {
  const { audit, isLoading } = useSecurity(siteId);
  const scanMutation = useSecurityScan(siteId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          {audit && (
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
              Last scan: <span className="text-brand-on-surface dark:text-brand-outline-variant font-semibold">{formatDate(audit.scannedAt)}</span>
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
          Run Scan
        </Button>
      </div>

      {audit ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Score" value={`${audit.score ?? 0}`} hint="Out of 100" accent={scoreAccent(audit.score)} />
            <KpiCard label="Total Checks" value={audit.totalChecks ?? 0} hint="Audited" accent="indigo" />
            <KpiCard label="Passed" value={audit.passedChecks ?? 0} hint="No issues" accent="emerald" />
            <KpiCard label="Failed" value={audit.failedChecks ?? 0} hint="Requires attention" accent={(audit.failedChecks ?? 0) > 0 ? 'rose' : 'sky'} />
          </div>

          <div>
            <SectionHeader number={1} title="Security Score" accent={scoreAccent(audit.score)} description="Aggregate score across all checks" />
            <Card>
              <ScoreBar
                score={audit.score}
                totalChecks={audit.totalChecks}
                passedChecks={audit.passedChecks}
                failedChecks={audit.failedChecks}
              />
            </Card>
          </div>

          <div>
            <SectionHeader number={2} title="Security Checks" accent="violet" description="Headers, TLS, exposed endpoints and best practices" />
            <Card>
              <SecurityCheckList checks={audit.checks} />
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-8">
            No security audit data. Run a scan to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
