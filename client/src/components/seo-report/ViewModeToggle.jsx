import { useSeoReportStore } from '../../store/seoReportStore';

export default function ViewModeToggle() {
  const viewMode = useSeoReportStore((s) => s.viewMode);
  const setViewMode = useSeoReportStore((s) => s.setViewMode);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('charts')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${ viewMode === 'charts' ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm' : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline' } font-label`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z" />
          </svg>
        Summary
        </button>
        <button
          onClick={() => setViewMode('details')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${ viewMode === 'details' ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm' : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline' } font-label`}
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
