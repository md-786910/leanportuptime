import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

const statusOptions = [
  { 
    label: 'Filters', 
    value: '', 
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    label: 'Favorites', 
    value: 'favorites', 
    icon: (
      <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
      </svg>
    )
  },
  { 
    label: 'Operational', 
    value: 'up', 
    dotColor: 'bg-emerald-500'
  },
  { 
    label: 'Critical', 
    value: 'down', 
    dotColor: 'bg-rose-500'
  },
  { 
    label: 'Degraded', 
    value: 'degraded', 
    dotColor: 'bg-amber-500'
  },
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
      {/* Custom Status Filter Dropdown */}
      <div className="relative w-full sm:w-auto" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 border-2 ${
            isOpen
              ? 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-sm'
              : 'bg-white dark:bg-brand-surface-container-low border-brand-outline-variant/50 dark:border-brand-outline/20 text-brand-on-surface dark:text-white hover:border-brand-primary/30'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {currentOption.icon ? (
              <span className="flex-shrink-0">{currentOption.icon}</span>
            ) : (
              <span className={`h-2.5 w-2.5 rounded-full ${currentOption.dotColor}`} />
            )}
            <span className="truncate text-left text-xs uppercase tracking-widest">{currentOption.label}</span>
          </div>
          <svg 
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 sm:left-auto sm:w-64 mt-2 bg-white dark:bg-brand-surface-container-low border-2 border-brand-outline-variant/30 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 mb-1 border-b border-brand-outline-variant/20">
              <span className="text-[10px] font-black text-brand-outline tracking-[0.2em]">Filter Assets</span>
            </div>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-on-surface dark:text-gray-200 hover:bg-brand-surface-container-lowest'
                }`}
              >
                {opt.icon ? (
                  <span className="flex-shrink-0 opacity-80">{opt.icon}</span>
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${opt.dotColor}`} />
                )}
                <span className="flex-1 text-left uppercase tracking-wider">{opt.label}</span>
                {statusFilter === opt.value && (
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Site Button */}
      {onAddSite && (
        <Button 
          onClick={onAddSite} 
          size="md" 
          className="w-full sm:w-auto px-6 h-[46px] rounded-xl font-black tracking-widest gap-3 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      )}
    </div>
  );
}
