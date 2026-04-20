import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Badge from '../common/Badge';
import { formatRelative } from '../../utils/formatters';
import * as sitesApi from '../../api/sites.api';

export default function SiteCard({ site }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    const next = !site.isFavorite;
    queryClient.setQueryData(['sites'], (old) => {
      if (!old?.data) return old;
      return { ...old, data: old.data.map((s) => (s._id === site._id ? { ...s, isFavorite: next } : s)) };
    });
    try {
      await sitesApi.updateSite(site._id, { isFavorite: next });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    }
  };

  return (
    <Card
      padding="sm"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/sites/${site._id}`)}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {site.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{site.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={site.isFavorite ? 'Unmark favorite' : 'Mark as favorite'}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 ${site.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
              fill={site.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
            </svg>
          </button>
          <StatusBadge status={site.currentStatus} />
        </div>
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
