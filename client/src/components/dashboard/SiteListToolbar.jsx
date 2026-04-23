import Button from '../common/Button';

const statusOptions = [
  { label: 'All Sites', value: '' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Up', value: 'up' },
  { label: 'Down', value: 'down' },
  { label: 'Degraded', value: 'degraded' },
  { label: 'Pending', value: 'pending' },
];

export default function SiteListToolbar({ onAddSite, statusFilter, onStatusFilterChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {onAddSite && (
        <Button onClick={onAddSite} className="gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      )}
    </div>
  );
}
