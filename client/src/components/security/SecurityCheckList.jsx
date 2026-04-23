import Badge from '../common/Badge';

const statusVariant = { pass: 'success', fail: 'danger', warn: 'warning' };
const severityVariant = { low: 'neutral', medium: 'info', high: 'warning', critical: 'danger' };

export default function SecurityCheckList({ checks }) {
  if (!checks?.length) {
    return <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-4">No security checks</p>;
  }

  return (
    <div className="space-y-2">
      {checks.map((check, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg border border-brand-outline-variant dark:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50"
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
          </div>
        </div>
      ))}
    </div>
  );
}
