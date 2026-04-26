import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { formatRelative } from '../../utils/formatters';

export default function SiteHeader({ site, onTriggerCheck, onTogglePause, onEdit, onDelete, isCheckLoading }) {
  return (
    <div className="w-full bg-brand-surface-container-lowest dark:bg-brand-on-surface/20 rounded-2xl p-6 border border-brand-outline-variant dark:border-brand-outline/30 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-fixed-dim">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-on-surface dark:text-white font-headline truncate">
                {site.name}
              </h1>
              <StatusBadge status={site.currentStatus} className="px-3 py-1 text-xs" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-on-primary-fixed-variant dark:text-brand-primary-fixed-dim transition-colors truncate"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {site.url}
              </a>
              <span className="hidden sm:inline text-brand-outline-variant dark:text-brand-outline">•</span>
              <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
                Last checked <span className="font-semibold">{formatRelative(site.lastCheckedAt)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="primary" 
            size="md" 
            onClick={onTriggerCheck} 
            isLoading={isCheckLoading}
            className="flex-1 sm:flex-none shadow-brand-primary/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Check Now
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="secondary" 
              size="md" 
              onClick={onTogglePause}
              className="flex-1 sm:flex-none"
            >
              {site.paused ? (
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {site.paused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="secondary" size="md" onClick={onEdit} className="flex-1 sm:flex-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button variant="danger" size="md" onClick={onDelete} className="flex-1 sm:flex-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
