import { startOfMonth, format } from 'date-fns';
import DateRangePicker from './DateRangePicker';

/**
 * Converts a period key + optional custom dates into { from, to } for the backend.
 * Returns null for preset strings the backend already handles (7d, 28d, 2m).
 */
export function computeDateRange(period, customFrom, customTo) {
  if (period === 'custom' && customFrom && customTo) {
    return {
      from: format(customFrom, 'yyyy-MM-dd'),
      to: format(customTo, 'yyyy-MM-dd'),
    };
  }
  if (period === 'thisMonth') {
    const now = new Date();
    return {
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to: format(now, 'yyyy-MM-dd'),
    };
  }
  return null;
}

/**
 * Shared segmented-control date filter for SEO report sections.
 *
 * Props:
 *   periods        – [{ key, label }]
 *   period         – active key
 *   setPeriod      – setter
 *   customFrom     – Date | null
 *   setCustomFrom  – setter
 *   customTo       – Date | null
 *   setCustomTo    – setter
 *   defaultPeriod  – key to reset to on cancel (default: 'thisMonth')
 */
export default function SectionDateFilter({
  periods,
  period,
  setPeriod,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  defaultPeriod = 'thisMonth',
}) {
  const hasCustomDates = period === 'custom' && customFrom && customTo;

  const handleClear = () => {
    setCustomFrom(null);
    setCustomTo(null);
    setPeriod(defaultPeriod);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Segmented control — matches StrategyToggle style */}
      <div className="flex gap-1 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-lg p-0.5">
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap font-label ${
              period === p.key
                ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm'
                : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inline date picker — visible only when Custom is active */}
      {period === 'custom' && (
        <DateRangePicker
          startDate={customFrom}
          endDate={customTo}
          onChange={([s, e]) => { setCustomFrom(s); setCustomTo(e); }}
          maxDate={new Date()}
          align="right"
        />
      )}

      {/* Cancel button — visible only once both custom dates are chosen */}
      {hasCustomDates && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear date filter"
          className="flex items-center justify-center w-6 h-6 rounded-md text-brand-outline hover:text-brand-on-surface hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
