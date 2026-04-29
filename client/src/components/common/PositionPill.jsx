// Colored position pill used for SERP positions, severities, scores in tables.
//
//   <PositionPill position={5} />          → green pill (top 10)
//   <PositionPill position={18} />         → emerald (light) pill
//   <PositionPill position={42} />         → amber pill
//   <PositionPill position={null} />       → "Not ranked" gray pill
//
// `tier` overrides the default thresholds (top-3 / top-10 / top-30 / rest):
//   <PositionPill value="P1" tier="critical" /> → rose pill
export default function PositionPill({ position, value, tier, className = '' }) {
  let cls;
  let display;

  if (tier) {
    cls = TIER_CLS[tier] || TIER_CLS.neutral;
    display = value ?? '';
  } else if (position == null) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-label bg-brand-surface-container-high dark:bg-brand-on-surface/60 text-brand-outline ${className}`}>
        {value || 'Not ranked'}
      </span>
    );
  } else {
    cls = position <= 3 ? TIER_CLS.top3
        : position <= 10 ? TIER_CLS.top10
        : position <= 30 ? TIER_CLS.top30
        : TIER_CLS.rest;
    display = position;
  }

  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-[12px] font-bold font-headline tabular-nums ${cls} ${className}`}>
      {display}
    </span>
  );
}

const TIER_CLS = {
  top3:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  top10:    'bg-emerald-50/60 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:ring-emerald-500/10',
  top30:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  rest:     'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
  // Generic severity tiers
  good:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  warn:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  critical: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
  info:     'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
  neutral:  'bg-brand-surface-container-high dark:bg-brand-on-surface/60 text-brand-on-surface-variant dark:text-brand-outline ring-1 ring-brand-outline-variant/60 dark:ring-brand-outline/60',
};
