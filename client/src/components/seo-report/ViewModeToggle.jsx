import { useSeoReportStore } from '../../store/seoReportStore';

export default function ViewModeToggle() {
  const viewMode = useSeoReportStore((s) => s.viewMode);
  const setViewMode = useSeoReportStore((s) => s.setViewMode);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('charts')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'charts'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z" />
          </svg>
          Charts
        </button>
        <button
          onClick={() => setViewMode('details')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'details'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h7" />
          </svg>
          Details
        </button>
      </div>
    </div>
  );
}
