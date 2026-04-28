const ACCENTS = {
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function ReportSection({ title, description, accent = 'violet', icon, actions, children }) {
  const accentClasses = ACCENTS[accent] || ACCENTS.violet;

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4 px-1">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${accentClasses}`}>
          {typeof icon === 'string' ? (
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black font-headline text-brand-on-surface dark:text-brand-outline-variant leading-tight tracking-tight uppercase">
              {title}
            </h2>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
          </div>
          {description && (
            <p className="text-sm text-brand-on-surface-variant/80 dark:text-brand-outline mt-1 font-label leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}