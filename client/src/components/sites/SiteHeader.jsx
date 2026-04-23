import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { formatRelative } from '../../utils/formatters';

export default function SiteHeader({ site, onTriggerCheck, onTogglePause, onEdit, onDelete, isCheckLoading }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-brand-on-surface dark:text-white font-headline">{site.name}</h1>
          <StatusBadge status={site.currentStatus} />
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-primary hover:text-brand-700 dark:text-brand-400"
        >
          {site.url}
        </a>
        <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline mt-1 font-label">
          Last checked {formatRelative(site.lastCheckedAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="primary" size="sm" onClick={onTriggerCheck} isLoading={isCheckLoading}>
          Check Now
        </Button>
        <Button variant="secondary" size="sm" onClick={onTogglePause}>
          {site.paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}
