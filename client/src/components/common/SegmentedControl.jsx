// Segmented control used as period/filter selector across the app.
// Tinted track with an inset shadow; raised white pill for the active option.
//
//   <SegmentedControl
//     options={[{ key: '7d', label: '7 days' }, { key: '28d', label: '28 days' }]}
//     value={period}
//     onChange={setPeriod}
//   />
//
// `size`: 'sm' (default), 'md'.

const SIZE = {
  sm: { track: 'p-1', btn: 'px-3 py-1.5 text-xs' },
  md: { track: 'p-1', btn: 'px-4 py-2 text-sm' },
};

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'sm',
  className = '',
  fullWidth = false,
}) {
  const s = SIZE[size] || SIZE.sm;
  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-brand-surface-container-high/70 dark:bg-brand-on-surface/40 rounded-xl border border-brand-outline-variant/60 dark:border-brand-outline/60 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] ${s.track} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange?.(opt.key)}
            disabled={opt.disabled}
            className={`${s.btn} ${fullWidth ? 'flex-1' : ''} rounded-lg transition-all whitespace-nowrap font-label disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? 'bg-white dark:bg-brand-on-surface text-brand-primary dark:text-brand-400 font-bold shadow-sm ring-1 ring-brand-outline-variant/60 dark:ring-brand-outline/60'
                : 'text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline-variant font-medium'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
