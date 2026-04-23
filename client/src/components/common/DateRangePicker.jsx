import { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfYear, endOfYear, subYears,
  format,
} from 'date-fns';

const DEFAULT_PRESETS = [
  { key: 'today', label: 'Today', range: () => { const d = new Date(); return [startOfDay(d), endOfDay(d)]; } },
  { key: 'yesterday', label: 'Yesterday', range: () => { const d = subDays(new Date(), 1); return [startOfDay(d), endOfDay(d)]; } },
  { key: 'thisWeek', label: 'This Week', range: () => [startOfWeek(new Date()), endOfWeek(new Date())] },
  { key: 'lastWeek', label: 'Last Week', range: () => { const d = subWeeks(new Date(), 1); return [startOfWeek(d), endOfWeek(d)]; } },
  { key: 'thisMonth', label: 'This Month', range: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
  { key: 'lastMonth', label: 'Last Month', range: () => { const d = subMonths(new Date(), 1); return [startOfMonth(d), endOfMonth(d)]; } },
  { key: 'thisYear', label: 'This Year', range: () => [startOfYear(new Date()), endOfYear(new Date())] },
  { key: 'lastYear', label: 'Last Year', range: () => { const d = subYears(new Date(), 1); return [startOfYear(d), endOfYear(d)]; } },
];

/**
 * Reusable date range picker with presets sidebar + two-month calendar.
 *
 * Props:
 *   startDate, endDate: Date | null — current selection
 *   onChange(dates): called with [start, end] (Date | null on each side)
 *   minDate, maxDate: optional bounds
 *   presets: optional override for the sidebar shortcuts
 *   align: 'left' | 'right' — which edge the popup anchors to
 *   placeholderStart, placeholderEnd: strings shown when empty
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
  presets = DEFAULT_PRESETS,
  placeholderStart = 'Start date',
  placeholderEnd = 'End date',
  className = '',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const { startLabel, endLabel } = useMemo(() => ({
    startLabel: startDate ? format(startDate, 'MMM d, yyyy') : placeholderStart,
    endLabel: endDate ? format(endDate, 'MMM d, yyyy') : placeholderEnd,
  }), [startDate, endDate, placeholderStart, placeholderEnd]);

  const filled = !!(startDate && endDate);

  const handlePreset = (preset) => {
    const [ns, ne] = preset.range();
    onChange([ns, ne]);
    setOpen(false);
  };

  const handleCalendarChange = (dates) => {
    const [ns, ne] = dates;
    onChange([ns, ne]);
    if (ns && ne) setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface hover:border-brand-400 focus:ring-2 focus:ring-brand-primary-container focus:outline-none font-label"
      >
        <span className={startDate ? 'text-brand-on-surface dark:text-brand-outline-variant' : 'text-brand-outline'}>{startLabel}</span>
        <svg className="w-3 h-3 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className={endDate ? 'text-brand-on-surface dark:text-brand-outline-variant' : 'text-brand-outline'}>{endLabel}</span>
        <svg className={`w-3.5 h-3.5 ml-1 ${filled ? 'text-brand-on-surface-variant dark:text-brand-outline' : 'text-brand-outline'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className={`absolute z-40 mt-1 ${align === 'right' ? 'right-0' : 'left-0'} flex rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface shadow-xl`}>
          <div className="flex flex-col w-28 border-r border-brand-outline-variant dark:border-brand-outline py-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePreset(p)}
                className="text-left px-3 py-1.5 text-xs text-brand-on-surface dark:text-brand-outline-variant hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors font-label"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="daterangepicker-inline">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleCalendarChange}
              monthsShown={2}
              minDate={minDate}
              maxDate={maxDate}
              inline
            />
          </div>
        </div>
      )}
    </div>
  );
}
