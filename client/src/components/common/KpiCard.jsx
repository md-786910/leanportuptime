// White card with a 3px colored top-bar accent — the design language used across
// the SEO Report sections. Use this everywhere a metric/KPI is displayed.
//
//   <KpiCard label="Total Users" value="2.0K" hint="Distinct users" accent="indigo" />
//
// `accent` keys: indigo | emerald | amber | violet | blue | rose | sky
// Optional slots: `delta` (right of label, e.g. a colored chip), `sparkline` / `chart`
// (rendered above hint), `icon` (small icon left of label).

const ACCENTS = {
  indigo:  'bg-[#6366F1] dark:bg-[#818CF8]',
  emerald: 'bg-[#10B981] dark:bg-[#34D399]',
  amber:   'bg-[#F59E0B] dark:bg-[#FBBF24]',
  violet:  'bg-[#8B5CF6] dark:bg-[#A78BFA]',
  blue:    'bg-[#3B82F6] dark:bg-[#60A5FA]',
  rose:    'bg-[#F43F5E] dark:bg-[#FB7185]',
  sky:     'bg-[#0EA5E9] dark:bg-[#38BDF8]',
};

export default function KpiCard({
  label,
  value,
  hint,
  accent = 'indigo',
  delta,
  icon,
  chart,
  className = '',
}) {
  const bar = ACCENTS[accent] || ACCENTS.indigo;
  return (
    <div
      className={`relative rounded-xl bg-white dark:bg-brand-surface-container-lowest border border-brand-outline-variant/70 dark:border-brand-outline/60 px-4 pt-4 pb-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-brand-outline-variant dark:hover:border-brand-outline transition-all overflow-hidden group ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${bar}`} />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-brand-outline dark:text-brand-on-surface-variant flex-shrink-0">{icon}</span>}
          <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.18em] truncate">
            {label}
          </p>
        </div>
        {delta && <div className="flex-shrink-0">{delta}</div>}
      </div>
      <p className="text-[26px] font-headline font-extrabold text-brand-on-surface dark:text-white tabular-nums leading-none mb-1">
        {value}
      </p>
      {chart && <div className="mt-1">{chart}</div>}
      {hint && (
        <p className="text-[10.5px] text-brand-outline dark:text-brand-on-surface-variant font-medium font-label leading-tight mt-1">{hint}</p>
      )}
    </div>
  );
}

export const KPI_ACCENTS = Object.keys(ACCENTS);
