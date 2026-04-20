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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor all your WordPress sites</p>
      </div>

      <KPICards sites={sites} />

      <SiteListToolbar
        onAddSite={isAdmin ? () => setShowAddModal(true) : null}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <SiteGrid
        sites={visibleSites}
        isLoading={isLoading}
        onAddSite={() => setShowAddModal(true)}
      />

      <Pagination
        page={page}
        total={meta.total || 0}
        limit={12}
        onPageChange={setPage}
      />

      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
