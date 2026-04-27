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
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          border: 'border-emerald-200/50 dark:border-emerald-500/20',
          dot: 'bg-emerald-500'
        };
      case 'down':
        return {
          label: 'CRITICAL',
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-500/10',
          border: 'border-rose-200/50 dark:border-rose-500/20',
          dot: 'bg-rose-500'
        };
      case 'degraded':
        return {
          label: 'DEGRADED',
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          border: 'border-amber-200/50 dark:border-amber-500/20',
          dot: 'bg-amber-500'
        };
      default:
        return {
          label: 'PENDING',
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-500/10',
          border: 'border-slate-200/50 dark:border-slate-500/20',
          dot: 'bg-slate-400'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-xs font-bold text-brand-outline uppercase tracking-widest animate-pulse">Synchronizing Fleet State...</p>
        </div>
      </div>
    );
  }

  if (!sites.length) {
    return (
      <EmptyState
        icon={
          <div className="p-6 bg-brand-primary/5 rounded-full border-2 border-dashed border-brand-primary/20">
            <svg className="h-12 w-12 text-brand-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
        }
        title="Infrastructure Empty"
        description="Your monitoring fleet is currently empty. Connect your first WordPress asset to begin real-time surveillance."
        action={<Button onClick={onAddSite} size="lg" className="rounded-xl shadow-lg shadow-brand-primary/20">Initialize Asset</Button>}
      />
    );
  }

  const sorted = [...sites].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  return (
    <div className="bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface-container-lowest dark:bg-brand-on-surface/60 border-b border-brand-outline-variant dark:border-brand-outline/20">
              <th className="px-6 py-4 text-[10px] font-black text-brand-outline uppercase tracking-[0.2em]">Asset Identity</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-outline uppercase tracking-[0.2em]">Live Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-outline uppercase tracking-[0.2em]">Last Sync</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-outline uppercase tracking-[0.2em]">Fleet Tags</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] text-right">Telemetry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline-variant dark:divide-brand-outline/10">
            {sorted.map((site) => {
              const status = getStatusConfig(site.currentStatus);
              return (
                <tr
                  key={site._id}
                  onClick={() => navigate(`/sites/${site._id}`)}
                  className="group hover:bg-brand-surface-container-lowest dark:hover:bg-brand-on-surface/30 transition-all duration-200 cursor-pointer"
                >
                  {/* Site Identity */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, site)}
                        className={`flex-shrink-0 p-2 rounded-xl border transition-all ${
                          site.isFavorite 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                            : 'bg-brand-surface-container-low border-brand-outline-variant/50 text-brand-outline group-hover:border-brand-primary/30 group-hover:text-brand-primary'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${site.isFavorite ? 'fill-current' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
                        </svg>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-on-surface dark:text-white truncate tracking-tight">
                            {site.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-outline tracking-wider uppercase mt-0.5">
                          <span className="opacity-60">{site.url.replace(/^https?:\/\//, '')}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${status.border} ${status.bg} shadow-sm`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${site.currentStatus !== 'pending' && !site.paused ? 'animate-pulse shadow-[0_0_8px_rgba(var(--tw-shadow-color),0.6)]' : ''}`} style={{'--tw-shadow-color': site.currentStatus === 'up' ? '16,185,129' : '239,68,68'}} />
                      <span className={`text-[10px] font-black tracking-widest ${status.color}`}>
                        {status.label}
                      </span>
                      {site.paused && <span className="text-[9px] font-bold opacity-50 ml-1">PAUSED</span>}
                    </div>
                  </td>

                  {/* Last Sync */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-brand-on-surface dark:text-white">
                        {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'N/A'}
                      </span>
                      <span className="text-[10px] font-medium text-brand-outline uppercase tracking-wider mt-0.5">
                        Pulse Sync
                      </span>
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      {site.tags?.length > 0 ? (
                        <>
                          {site.tags.slice(0, 1).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-brand-surface-container dark:bg-brand-on-surface/20 text-[10px] font-bold text-brand-outline uppercase tracking-wider border border-brand-outline-variant/30"
                            >
                              {tag}
                            </span>
                          ))}
                          {site.tags.length > 1 && (
                            <span className="text-[10px] font-bold text-brand-outline/60">
                              +{site.tags.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="h-px w-4 bg-brand-outline-variant opacity-50" />
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {/* Mini sparkline placeholder or score */}
                       <div className="flex flex-col items-end mr-4">
                         <span className={`text-xs font-black ${site.securityScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                           {site.securityScore || 0}%
                         </span>
                         <span className="text-[9px] font-bold text-brand-outline uppercase tracking-tighter">SEC SCORE</span>
                       </div>
                       
                       <div className="p-2 rounded-xl bg-brand-surface-container-low dark:bg-brand-on-surface/10 text-brand-outline group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all border border-transparent group-hover:border-brand-primary/20">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
