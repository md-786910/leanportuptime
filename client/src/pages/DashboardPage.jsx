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
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const params = { page, limit: 12 };
  if (statusFilter) params.status = statusFilter;

  const { sites, meta, isLoading } = useSites(params);

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
        onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      <SiteGrid
        sites={sites}
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
