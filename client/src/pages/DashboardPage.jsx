import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSites } from '../hooks/useSites';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import SiteListToolbar from '../components/dashboard/SiteListToolbar';
import SitesTable from '../components/dashboard/SitesTable';
import Pagination from '../components/common/Pagination';
import AddSiteModal from '../components/sites/AddSiteModal';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('filter') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [showAddModal, setShowAddModal] = useState(false);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  const setPage = (p) => updateParams({ page: p === 1 ? '' : p });
  const setStatusFilter = (v) => updateParams({ filter: v, page: '' });

  const params = { page, limit: 12 };
  if (statusFilter && statusFilter !== 'favorites') params.status = statusFilter;

  const { sites, meta, isLoading } = useSites(params);
  const visibleSites = statusFilter === 'favorites' ? sites.filter((s) => s.isFavorite) : sites;

  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const critical = down > 0;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Section: Header with Critical Alert */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
              Monitoring Dashboard
            </h1>
            <p className="text-sm md:text-base text-brand-outline dark:text-brand-on-surface-variant font-medium mt-2">
              Real-time infrastructure health & performance insights
            </p>
          </div>
          {critical && (
            <div className="px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center gap-2 whitespace-nowrap">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Critical Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Analytics & Performance Graphs */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
              Analytics & Performance
            </h2>
            <p className="text-xs md:text-sm text-brand-outline dark:text-brand-on-surface-variant font-medium mt-1">
              Real-time traffic, events, and engagement metrics
            </p>
          </div>
          <div className="text-xs font-medium text-brand-outline dark:text-brand-on-surface-variant px-3 py-1.5 bg-brand-surface-container-low dark:bg-brand-surface-container rounded-lg">
            Live
          </div>
        </div>
        <DashboardAnalytics sites={sites} isLoading={isLoading} />
      </div>

      {/* Section 2: Sites Management Section */}
      <div className="space-y-5 border-t border-brand-outline-variant dark:border-brand-outline/20 pt-10">
        {/* Section Header with Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
              Monitored Sites
            </h2>
            <p className="text-xs md:text-sm text-brand-outline dark:text-brand-on-surface-variant font-medium mt-1">
              <span className="font-semibold text-brand-on-surface dark:text-white">{visibleSites.length}</span> of {total} site{total !== 1 ? 's' : ''} displayed
            </p>
          </div>

          {/* Toolbar */}
          <SiteListToolbar
            onAddSite={isAdmin ? () => setShowAddModal(true) : null}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Site Table Container */}
        <div className="min-h-[400px]">
          <SitesTable
            sites={visibleSites}
            isLoading={isLoading}
            onAddSite={() => setShowAddModal(true)}
          />
        </div>

        {/* Pagination */}
        {meta.total > 12 && (
          <div className="pt-8 border-t border-brand-outline-variant dark:border-brand-outline/20">
            <Pagination
              page={page}
              total={meta.total || 0}
              limit={12}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
