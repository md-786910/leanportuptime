import { PRESETS } from './useComparePeriods';

/**
 * Period selector shared by every Compare* modal.
 *
 * Renders the 5 preset chips. In Custom mode, no extra UI appears here —
 * the date ranges are picked by clicking the table column headers
 * (see RangeHeaderButton), which keeps the selector compact.
 */
export default function ComparePeriodSelector({
  presetKey,
  onPresetChange,
  isCustom,
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-outline dark:text-brand-on-surface-variant font-label ml-0.5">
        Compare with
      </p>
      <div className="flex flex-wrap items-center gap-1 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-lg p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPresetChange(p.key)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap font-label ${
              presetKey === p.key
                ? 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant shadow-sm'
                : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {isCustom && (
        <p className="text-[11px] text-brand-outline font-label ml-0.5 pt-0.5">
          Click a date in the table headers below to set each range.
        </p>
      )}
    </div>
  );
}
