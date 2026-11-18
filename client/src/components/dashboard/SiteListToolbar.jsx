import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

const statusOptions = [
  { label: 'All sites', value: '', icon: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { label: 'Favorites', value: 'favorites', icon: (
    <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
    </svg>
  )},
  { label: 'Operational', value: 'up', color: 'bg-emerald-500' },
  { label: 'Down', value: 'down', color: 'bg-rose-500' },
  { label: 'Degraded', value: 'degraded', color: 'bg-amber-500' },
  { label: 'Pending', value: 'pending', color: 'bg-slate-400' },
];

export default function SiteListToolbar({ onAddSite, statusFilter, onStatusFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentOption = statusOptions.find(opt => opt.value === statusFilter) || statusOptions[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {/* Custom Dropdown */}
      <div className="relative flex-1 sm:flex-none sm:min-w-[190px]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-9 flex items-center justify-between gap-3 px-3 bg-white dark:bg-brand-inverse-surface border rounded-lg text-[13px] font-medium shadow-card transition-all ${ isOpen ? 'border-brand-primary/40 ring-4 ring-brand-primary/5' : 'border-brand-outline-variant/60 dark:border-white/10 hover:border-brand-outline-variant' }`}
        >
          <div className="flex items-center gap-2.5">
            {currentOption.icon ? (
              <span className="flex-shrink-0">{currentOption.icon}</span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${currentOption.color} `} />
            )}
            <span className="text-slate-700 dark:text-slate-200">{currentOption.label}</span>
          </div>
          <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-56 bg-white dark:bg-brand-inverse-surface border border-brand-outline-variant/60 dark:border-white/10 rounded-xl shadow-soft p-1.5 z-50">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition-colors rounded-lg ${ statusFilter === opt.value ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white' }`}
              >
                {opt.icon ? (
                  <span className="flex-shrink-0">{opt.icon}</span>
                ) : (
                  <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                )}
                <span className="flex-1 text-left">{opt.label}</span>
                {statusFilter === opt.value && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {onAddSite && (
        <Button onClick={onAddSite} size="md" className="h-9 !py-0 px-4 whitespace-nowrap">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      )}
    </div>
  );
}
