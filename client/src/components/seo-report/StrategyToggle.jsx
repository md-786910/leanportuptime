export default function StrategyToggle({ strategy, onChange, hasMobile, hasDesktop }) {
  if (!hasMobile && !hasDesktop) return null;

  return (
    <div className="flex gap-1 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-lg p-0.5">
      {hasMobile && (
        <button
          onClick={() => onChange('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${ strategy === 'mobile' ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm' : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline' } font-label`}
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${ strategy === 'desktop' ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm' : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline' } font-label`}
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
