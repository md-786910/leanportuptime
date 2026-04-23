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
      padding="md"
      className="group cursor-pointer hover:border-brand-500/50 hover:shadow-soft transition-all duration-300 flex flex-col relative overflow-hidden active:scale-[0.98]"
      onClick={() => navigate(`/sites/${site._id}`)}
    >
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors duration-500" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 relative z-10">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-brand-on-surface dark:text-white truncate tracking-tight group-hover:text-brand-primary dark:group-hover:text-brand-400 transition-colors">
            {site.name}
          </h3>
          <p className="text-[11px] font-medium text-brand-outline dark:text-brand-on-surface-variant truncate mt-0.5 ">
            {site.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={site.isFavorite ? 'Unmark favorite' : 'Mark as favorite'}
          className={`p-2 rounded-xl transition-all duration-200 ${ site.isFavorite ? 'bg-amber-50 dark:bg-amber-400/10 text-amber-500 shadow-sm' : 'text-brand-outline dark:text-brand-on-surface-variant hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface' }`}
        >
          <svg
            className={`w-4.5 h-4.5 ${site.isFavorite ? 'fill-current' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
          </svg>
        </button>
      </div>

      {/* Status and Tags */}
      <div className="flex-1 flex flex-col justify-between relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={site.currentStatus} />
          {site.paused && <Badge variant="warning">Monitoring Paused</Badge>}
        </div>

        {site.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {site.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="neutral" className="bg-brand-surface-container-lowest/50 dark:bg-brand-on-surface/50">
                {tag}
              </Badge>
            ))}
            {site.tags.length > 2 && (
              <Badge variant="neutral" className="bg-brand-surface-container-lowest/50 dark:bg-brand-on-surface/50">
                +{site.tags.length - 2} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-brand-outline-variant dark:border-brand-outline/60 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${site.currentStatus === 'up' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-widest font-label">
            {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'Awaiting check'}
          </p>
        </div>
        <svg className="w-4 h-4 text-brand-outline dark:text-brand-on-surface-variant group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  );
}
