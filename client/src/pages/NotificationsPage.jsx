import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

const typeVariant = {
  down: 'danger',
  up: 'success',
  ssl_expiry: 'warning',
  security_alert: 'danger',
  degraded: 'warning',
};

// Helper for notification icons based on type
function NotificationIcon({ type }) {
  const icons = {
    down: (
      <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    up: (
      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    ssl_expiry: (
      <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    security_alert: (
      <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.065 11.065 0 0112 2.123c-3.377 0-6.442 1.507-8.618 3.861a1.107 1.107 0 00-.142 1.396c2.518 3.328 3.931 7.245 3.931 11.45 0 1.32.122 2.61.353 3.86a1.114 1.114 0 001.076.91h9.593c.534 0 1.011-.383 1.076-.91a11.163 11.163 0 00.353-3.86c0-4.205 1.413-8.122 3.931-11.45a1.107 1.107 0 00-.142-1.396z" />
      </svg>
    ),
    degraded: (
      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  return (
    <div className="flex-shrink-0 p-2.5 bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl">
      {icons[type] || (
        <svg className="h-5 w-5 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { notifications, meta, isLoading } = useNotifications({ page, limit: 20 });

  return (
    <div className="space-y-8 max-w-8xl mx-auto">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-brand-on-surface dark:text-white tracking-tight">System Alerts</h1>
        <p className="text-brand-on-surface-variant dark:text-brand-outline mt-1.5 font-medium max-w-2xl">
          Keep track of important updates, site outages, and security alerts for your monitored services.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-bold text-brand-on-surface-variant animate-pulse uppercase tracking-widest font-label">Fetching activity log...</p>
        </div>
      ) : !notifications.length ? (
        <div className="animate-in fade-in duration-500">
          <EmptyState 
            title="All quiet here" 
            description="You don't have any notifications yet. We'll alert you if something needs your attention." 
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="h-2 w-2 rounded-full bg-brand-primary"></span>
            <h2 className="text-xs font-bold text-brand-on-surface-variant dark:text-brand-outline font-label">
              Recent Activity ({meta.total || 0})
            </h2>
          </div>

          <Card noPadding className="overflow-hidden shadow-sm border-brand-outline-variant dark:border-brand-outline">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => (
                <div 
                  key={n._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-5 hover:bg-brand-surface-container-low/50 dark:hover:bg-brand-on-surface/30 transition-all group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <NotificationIcon type={n.type} />
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant={typeVariant[n.type] || 'neutral'} className="text-[10px] font-extrabold px-2 font-label">
                          {n.type?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="neutral" className="text-[10px] px-2 font-label">
                          {n.channel}
                        </Badge>
                        {n.siteId && (
                          <Link 
                            to={`/sites/${n.siteId._id || n.siteId}`} 
                            className="text-[13px] font-bold text-brand-primary hover:text-brand-700 dark:text-brand-400 transition-colors flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {n.siteId.name || 'Site Profile'}
                          </Link>
                        )}
                      </div>
                      <p className="text-[14px] leading-relaxed text-brand-on-surface dark:text-brand-outline font-medium break-words">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 mt-4 sm:mt-0 sm:ml-8 pl-12 sm:pl-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${n.status === 'sent' ? 'bg-emerald-500' : n.status === 'failed' ? 'bg-rose-500' : 'bg-brand-surface-container-highest'}`}></div>
                      <span className="text-[10px] font-bold font-label text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-widest leading-none">
                        {n.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-brand-outline dark:text-brand-on-surface-variant whitespace-nowrap bg-brand-surface-container-low dark:bg-brand-on-surface px-2 py-1 rounded-md border border-brand-outline-variant dark:border-brand-outline font-label">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Footer / Pagination Section */}
      <div className="flex items-center justify-center pt-4 border-t border-brand-outline-variant dark:border-brand-outline">
        <Pagination 
          page={page} 
          total={meta.total || 0} 
          limit={20} 
          onPageChange={setPage} 
        />
      </div>
    </div>
  );
}
