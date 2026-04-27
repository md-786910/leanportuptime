import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSites } from '../hooks/useSites';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import SiteListToolbar from '../components/dashboard/SiteListToolbar';
import SitesTable from '../components/dashboard/SitesTable';
import Pagination from '../components/common/Pagination';
import AddSiteModal from '../components/sites/AddSiteModal';
import KPICards from '../components/dashboard/KPICards';

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
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const critical = down > 0;

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Section: Header with Critical Alert */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
              Command Center
            </h1>
            <p className="text-sm md:text-base text-brand-outline dark:text-brand-on-surface-variant font-medium">
              Real-time infrastructure health & performance insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {critical && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center gap-3 shadow-sm">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute inset-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
                </div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Critical Infrastructure Alert</span>
              </div>
            )}
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Systems Live</span>
            </div>
          </div>
        </div>

        {/* KPI Cards Section */}
        <KPICards sites={sites} />
      </div>

      {/* Section 1: Analytics & Performance Graphs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-brand-outline-variant dark:border-brand-outline/20 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline flex items-center gap-3">
              Analytics Intelligence
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Beta</span>
            </h2>
            <p className="text-xs md:text-sm text-brand-outline dark:text-brand-on-surface-variant font-medium">
              Aggregated traffic, events, and engagement metrics across your fleet
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-outline dark:text-brand-on-surface-variant px-4 py-2 bg-brand-surface-container-low dark:bg-brand-surface-container rounded-xl border border-brand-outline-variant dark:border-brand-outline/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            LIVE FEED
          </div>
        </div>
        <DashboardAnalytics sites={sites} isLoading={isLoading} />
      </div>

      {/* Section 2: Sites Management Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-brand-outline-variant dark:border-brand-outline/20 pb-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">
              Asset Inventory
            </h2>
            <p className="text-xs md:text-sm text-brand-outline dark:text-brand-on-surface-variant font-medium">
              Managing <span className="font-bold text-brand-on-surface dark:text-white">{visibleSites.length}</span> active endpoints
            </p>
          </div>

          <SiteListToolbar
            onAddSite={isAdmin ? () => setShowAddModal(true) : null}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="min-h-[400px]">
          <SitesTable
            sites={visibleSites}
            isLoading={isLoading}
            onAddSite={() => setShowAddModal(true)}
          />
        </div>

        {meta.total > 12 && (
          <div className="pt-8 flex justify-center">
            <Pagination
              page={page}
              total={meta.total || 0}
              limit={12}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
