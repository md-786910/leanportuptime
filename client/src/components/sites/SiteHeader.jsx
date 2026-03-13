import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { formatRelative } from '../../utils/formatters';

export default function SiteHeader({ site, onTriggerCheck, onTogglePause, onEdit, onDelete, isCheckLoading }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
          <StatusBadge status={site.currentStatus} />
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {site.url}
        </a>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
