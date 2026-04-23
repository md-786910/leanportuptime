import { useSecurity, useSecurityScan } from '../../hooks/useSecurity';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import ScoreBar from './ScoreBar';
import SecurityCheckList from './SecurityCheckList';
import { formatDate } from '../../utils/formatters';

export default function SecurityPanel({ siteId }) {
  const { audit, isLoading } = useSecurity(siteId);
  const scanMutation = useSecurityScan(siteId);

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
            <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Security Score</h3>
            <ScoreBar
              score={audit.score}
              totalChecks={audit.totalChecks}
              passedChecks={audit.passedChecks}
              failedChecks={audit.failedChecks}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Security Checks</h3>
            <SecurityCheckList checks={audit.checks} />
          </Card>
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
