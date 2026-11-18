import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSites } from '../hooks/useSites';
import KPICards from '../components/dashboard/KPICards';
import SiteListToolbar from '../components/dashboard/SiteListToolbar';
import SiteGrid from '../components/dashboard/SiteGrid';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight font-headline">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Uptime and performance across all your sites.
        </p>
      </div>

      <KPICards statusCounts={meta.statusCounts} />

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white font-headline">Sites</h2>
            {meta.total > 0 && (
              <span className="text-[13px] text-slate-400 tabular-nums">{meta.total}</span>
            )}
          </div>
          <SiteListToolbar
            onAddSite={isAdmin ? () => setShowAddModal(true) : null}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="min-h-[400px]">
          <SiteGrid
            sites={visibleSites}
            isLoading={isLoading}
            onAddSite={() => setShowAddModal(true)}
          />
        </div>

        <Pagination
          page={page}
          total={meta.total || 0}
          limit={12}
          onPageChange={setPage}
        />
      </section>

      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
