import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import * as sitesApi from '../../api/sites.api';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatRelative } from '../../utils/formatters';

export default function SitesTable({ sites, isLoading, onAddSite }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toggleFavorite = async (e, site) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30';
      case 'down':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30';
      case 'degraded':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30';
      default:
        return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'up':
        return 'Operational';
      case 'down':
        return 'Critical';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Pending';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-brand-outline dark:text-brand-on-surface-variant">Loading sites...</p>
        </div>
      </div>
    );
  }

  if (!sites.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        }
        title="No sites found"
        description="Start monitoring your WordPress sites to track uptime, performance metrics, and security alerts in real-time."
        action={<Button onClick={onAddSite} size="lg">Add Your First Site</Button>}
      />
    );
  }

  const sorted = [...sites].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  return (
    <div className="border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg overflow-hidden bg-brand-surface-container-lowest dark:bg-brand-on-surface/40">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-brand-surface-container-low dark:bg-brand-on-surface/60 border-b border-brand-outline-variant dark:border-brand-outline/40 font-semibold text-sm text-brand-on-surface dark:text-white">
        <div className="col-span-4">Site Name</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Last Check</div>
        <div className="col-span-2">Tags</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-brand-outline-variant dark:divide-brand-outline/40">
        {sorted.map((site) => (
          <div
            key={site._id}
            onClick={() => navigate(`/sites/${site._id}`)}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface/50 transition-colors duration-150 cursor-pointer items-center"
          >
            {/* Site Name */}
            <div className="col-span-4 min-w-0">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, site)}
                  className="flex-shrink-0 p-1 rounded hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface/30 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 ${site.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-brand-outline-variant dark:text-brand-on-surface-variant'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-brand-on-surface dark:text-white truncate">
                    {site.name}
                  </h3>
                  <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant truncate">
                    {site.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusColor(site.currentStatus)}`}>
                <div className={`w-2 h-2 rounded-full ${site.currentStatus === 'up' ? 'bg-emerald-500 animate-pulse' : site.currentStatus === 'down' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                {getStatusLabel(site.currentStatus)}
                {site.paused && <span className="ml-1">(Paused)</span>}
              </div>
            </div>

            {/* Last Check */}
            <div className="col-span-2">
              <p className="text-xs font-medium text-brand-outline dark:text-brand-on-surface-variant">
                {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'Never'}
              </p>
            </div>

            {/* Tags */}
            <div className="col-span-2">
              {site.tags?.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                  {site.tags.slice(0, 1).map((tag) => (
                    <Badge
                      key={tag}
                      variant="neutral"
                      className="bg-brand-surface-container dark:bg-brand-on-surface/30 text-xs font-medium text-brand-on-surface dark:text-brand-outline-variant"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {site.tags.length > 1 && (
                    <span className="text-xs text-brand-outline dark:text-brand-on-surface-variant">
                      +{site.tags.length - 1}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-brand-outline-variant dark:text-brand-on-surface-variant">—</p>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-2 text-right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/sites/${site._id}`);
                }}
                className="p-2 rounded hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface/30 transition-colors"
              >
                <svg className="w-4 h-4 text-brand-outline dark:text-brand-on-surface-variant hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
