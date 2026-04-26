import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

const statusOptions = [
  { 
    label: 'All Sites', 
    value: '', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    label: 'Favorites', 
    value: 'favorites', 
    icon: (
      <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
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
    label: 'Critical (Down)', 
    value: 'down', 
    dotColor: 'bg-rose-500'
  },
  { 
    label: 'Degraded Performance', 
    value: 'degraded', 
    dotColor: 'bg-amber-500'
  },
  { 
    label: 'Pending', 
    value: 'pending', 
    dotColor: 'bg-gray-400'
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {/* Custom Status Filter Dropdown */}
      <div className="relative w-full sm:w-auto" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-3 px-5 py-3 rounded-lg font-semibold transition-all duration-200 border-2 ${
            isOpen
              ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'bg-white dark:bg-brand-on-surface/40 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {currentOption.icon ? (
              <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">{currentOption.icon}</span>
            ) : (
              <span className={`h-3 w-3 rounded-full ${currentOption.dotColor}`} />
            )}
            <span className="truncate text-left text-sm">{currentOption.label}</span>
          </div>
          <svg 
            className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 text-gray-400 dark:text-gray-500 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-3 z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[280px]">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {opt.icon ? (
                  <span className="flex-shrink-0">{opt.icon}</span>
                ) : (
                  <span className={`h-3 w-3 rounded-full ${opt.dotColor}`} />
                )}
                <span className="flex-1 text-left">{opt.label}</span>
                {statusFilter === opt.value && (
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          className="w-full sm:w-auto px-6 whitespace-nowrap font-semibold gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add New Site
        </Button>
      )}
    </div>
  );
}
