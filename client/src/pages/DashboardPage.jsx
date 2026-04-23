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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Performance Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Real-time optimization insights for senupilse.io
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards sites={sites} />

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sites</h2>
          <SiteListToolbar
            onAddSite={isAdmin ? () => setShowAddModal(true) : null}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Site Grid */}
        <div className="min-h-[400px]">
          <SiteGrid
            sites={visibleSites}
            isLoading={isLoading}
            onAddSite={() => setShowAddModal(true)}
          />
        </div>

        {/* Pagination */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
          <Pagination
            page={page}
            total={meta.total || 0}
            limit={12}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Add Site Modal */}
      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
