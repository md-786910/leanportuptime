import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

const statusOptions = [
  { label: 'Monitoring', value: '', icon: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { label: 'Favorite Sites', value: 'favorites', icon: (
    <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
    </svg>
  )},
  { label: 'Operational (Up)', value: 'up', color: 'bg-emerald-500' },
  { label: 'Critical (Down)', value: 'down', color: 'bg-rose-500' },
  { label: 'Performance Degraded', value: 'degraded', color: 'bg-amber-500' },
  { label: 'Nodes Pending', value: 'pending', color: 'bg-brand-surface-container-highest' },
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full sm:w-auto">
      {/* Custom Dropdown */}
      <div className="relative w-full sm:w-auto min-w-[170px]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-brand-surface-container-lowest dark:bg-brand-on-surface border rounded-xl text-[13px] font-bold transition-all duration-200 shadow-sm hover:border-brand-outline-variant dark:hover:border-brand-outline ${ isOpen ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-brand-outline-variant dark:border-brand-outline' }`}
        >
          <div className="flex items-center gap-2.5">
            {currentOption.icon ? (
              <span className="flex-shrink-0">{currentOption.icon}</span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${currentOption.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
            )}
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{currentOption.label}</span>
          </div>
          <svg className={`h-4 w-4 text-brand-outline transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-brand-surface-container-lowest dark:bg-brand-on-surface border border-brand-outline-variant dark:border-brand-outline rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors rounded-lg mx-auto max-w-[calc(100%-16px)] mb-0.5 last:mb-0 ${ statusFilter === opt.value ? 'bg-brand-50 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-400' : 'text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50 hover:text-brand-on-surface dark:hover:text-white' }`}
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
        <Button onClick={onAddSite} size="md" className="w-full sm:w-auto px-6 whitespace-nowrap">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      )}
    </div>
  );
}
