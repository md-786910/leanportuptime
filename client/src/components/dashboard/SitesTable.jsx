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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'up':
        return {
          label: 'OPERATIONAL',
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/20',
          glow: 'shadow-emerald-500/20'
        };
      case 'down':
        return {
          label: 'OFFLINE',
          color: 'text-rose-500',
          bg: 'bg-rose-500/5',
          border: 'border-rose-500/20',
          glow: 'shadow-rose-500/20'
        };
      case 'degraded':
        return {
          label: 'DEGRADED',
          color: 'text-amber-500',
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/20',
          glow: 'shadow-amber-500/20'
        };
      default:
        return {
          label: 'SCANNING',
          color: 'text-blue-400',
          bg: 'bg-blue-400/5',
          border: 'border-blue-400/20',
          glow: 'shadow-blue-400/20'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Spinner size="lg" />
        <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] animate-pulse">Syncing Telemetry...</p>
      </div>
    );
  }

  if (!sites.length) {
    return (
      <EmptyState
        icon={<svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
        title="Grid Empty"
        description="No endpoints registered in the current surveillance sector."
        action={<Button onClick={onAddSite} variant="primary">Register Asset</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {sites.map((site) => {
        const config = getStatusConfig(site.currentStatus);
        return (
          <div 
            key={site._id}
            onClick={() => navigate(`/sites/${site._id}`)}
            className="group relative bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant/30 rounded-3xl p-5 hover:border-brand-primary/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
          >
            {/* Top Identity Row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={(e) => toggleFavorite(e, site)}
                  className={`p-2 rounded-xl border transition-all ${
                    site.isFavorite 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                      : 'bg-brand-surface-container border-transparent text-brand-outline hover:text-amber-500'
                  }`}
                >
                  <svg className={`w-4 h-4 ${site.isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-brand-on-surface dark:text-white truncate uppercase tracking-tight italic">
                    {site.name}
                  </h3>
                  <p className="text-[10px] font-bold text-brand-outline truncate opacity-60 uppercase tracking-widest">
                    {site.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full border ${config.border} ${config.bg} flex items-center gap-2 shadow-inner`}>
                <div className={`w-1.5 h-1.5 rounded-full ${config.color} animate-pulse shadow-[0_0_8px_currentColor]`} />
                <span className={`text-[9px] font-black tracking-[0.2em] ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </div>

            {/* Metrics Telemetry Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Security', value: site.securityScore || 0, color: 'text-blue-500' },
                { label: 'Speed', value: site.siteScan?.performanceScore || 0, color: 'text-emerald-500' },
                { label: 'SEO', value: site.seo?.score || 0, color: 'text-brand-primary' },
              ].map((m, i) => (
                <div key={i} className="bg-brand-surface-container/50 dark:bg-brand-on-surface/5 rounded-2xl p-3 border border-brand-outline-variant/10">
                  <span className="block text-[8px] font-black text-brand-outline uppercase tracking-widest mb-1 opacity-60">{m.label}</span>
                  <span className={`text-sm font-black ${m.color}`}>{m.value}%</span>
                </div>
              ))}
            </div>

            {/* Action & Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-outline-variant/10">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {site.tags?.slice(0, 3).map((tag, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-brand-surface-container border-2 border-white dark:border-brand-surface-container-low flex items-center justify-center">
                      <span className="text-[7px] font-black uppercase">{tag[0]}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[9px] font-bold text-brand-outline uppercase opacity-60">
                  {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'No Sync'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-brand-surface-container text-brand-outline group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5-5m5 5H6" />
                </svg>
              </div>
            </div>

            {/* Subtle background glow on hover */}
            <div className={`absolute -bottom-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-current ${config.color}`} />
          </div>
        );
      })}
    </div>
  );
}
