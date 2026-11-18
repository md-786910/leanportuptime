import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../common/StatusBadge';
import Badge from '../common/Badge';
import { formatRelative } from '../../utils/formatters';
import * as sitesApi from '../../api/sites.api';

const TAG = '!normal-case !tracking-normal !font-medium !rounded-md !px-2 !bg-slate-100 dark:!bg-white/5 !text-slate-600 dark:!text-slate-300';

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

  const host = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/sites/${site._id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/sites/${site._id}`); }}
      className="group relative flex flex-col bg-white dark:bg-brand-inverse-surface border border-brand-outline-variant/60 dark:border-white/10 rounded-xl shadow-card p-5 cursor-pointer transition-all duration-200 hover:border-brand-outline-variant dark:hover:border-white/20 hover:shadow-soft hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[15px] font-semibold text-slate-600 dark:text-slate-300 uppercase font-headline">
          {(site.name || host).charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate leading-snug">
            {site.name}
          </h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{host}</p>
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={site.isFavorite ? 'Unmark favorite' : 'Mark as favorite'}
          className={`-mr-1.5 -mt-1 p-1.5 rounded-md transition-all ${
            site.isFavorite
              ? 'text-amber-400'
              : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <svg className={`w-[18px] h-[18px] ${site.isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
          </svg>
        </button>
      </div>

      {/* Tags */}
      {(site.paused || site.tags?.length > 0) && (
        <div className="flex flex-wrap gap-1.5 -mt-1 mb-5">
          {site.paused && <Badge variant="warning" className="!normal-case !tracking-normal !font-medium !rounded-md !px-2 !bg-amber-50 !text-amber-700">Paused</Badge>}
          {site.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="neutral" className={TAG}>{tag}</Badge>
          ))}
          {site.tags?.length > 2 && <Badge variant="neutral" className={TAG}>+{site.tags.length - 2}</Badge>}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
        <StatusBadge status={site.currentStatus} />
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-label min-w-0">
          <span className="truncate">
            {site.lastCheckedAt ? formatRelative(site.lastCheckedAt) : 'Awaiting check'}
          </span>
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
