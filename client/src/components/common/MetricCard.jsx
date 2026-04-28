// 4-up KPI card from the bento redesign.
// Reference: icon square + UPPERCASE label + Manrope-bold value + tiny accent delta.
const ACCENTS = {
  primary:   { bg: 'bg-brand-primary/10',    text: 'text-brand-primary'   },
  tertiary:  { bg: 'bg-brand-tertiary/10',   text: 'text-brand-tertiary'  },
  secondary: { bg: 'bg-brand-secondary/10',  text: 'text-brand-secondary' },
  emerald:   { bg: 'bg-emerald-500/10',      text: 'text-emerald-600'     },
  rose:      { bg: 'bg-rose-500/10',         text: 'text-rose-600'        },
};

export default function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaTone = 'primary',
  accent = 'primary',
  className = '',
}) {
  const a = ACCENTS[accent] || ACCENTS.primary;
  const deltaCls = ACCENTS[deltaTone]?.text || 'text-brand-primary';

  return (
    <div
      className={`bg-brand-surface-container-lowest dark:bg-brand-on-surface p-6 rounded-3xl shadow-sm border border-brand-outline-variant/10 dark:border-brand-outline/30 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.text} flex items-center justify-center flex-shrink-0`}>
          {icon && <span className="material-symbols-outlined">{icon}</span>}
        </div>
        <span className="font-label text-xs font-semibold text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="font-headline text-2xl font-bold text-brand-on-surface dark:text-white tabular-nums">
          {value}
        </h4>
        {delta && <span className={`text-[10px] font-bold ${deltaCls} tabular-nums`}>{delta}</span>}
      </div>
    </div>
  );
}
