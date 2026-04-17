export default function StrategyToggle({ strategy, onChange, hasMobile, hasDesktop }) {
  if (!hasMobile && !hasDesktop) return null;

  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {hasMobile && (
        <button
          onClick={() => onChange('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            strategy === 'mobile'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Mobile
        </button>
      )}
      {hasDesktop && (
        <button
          onClick={() => onChange('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            strategy === 'desktop'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
            <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
          </svg>
          Desktop
        </button>
      )}
    </div>
  );
}
