import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Badge from '../common/Badge';
import { formatRelative } from '../../utils/formatters';

export default function SiteCard({ site }) {
  const navigate = useNavigate();

  return (
    <Card
      padding="sm"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/sites/${site._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {site.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{site.url}</p>
        </div>
        <StatusBadge status={site.currentStatus} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'Not checked yet'}
        </p>
        {site.paused && <Badge variant="warning">Paused</Badge>}
      </div>

      {site.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {site.tags.map((tag) => (
            <Badge key={tag} variant="neutral">{tag}</Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
