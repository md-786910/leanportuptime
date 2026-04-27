const ACCENTS = {
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function ReportSection({ title, description, accent = 'violet', icon, actions, children }) {
  const accentClasses = ACCENTS[accent] || ACCENTS.violet;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 px-1">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClasses}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-brand-on-surface dark:text-brand-outline-variant leading-tight">
              {title}
            </h2>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
          {description && (
            <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline mt-0.5 font-label">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
