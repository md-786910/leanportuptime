const ACCENTS = {
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function ReportSection({ hidden = false, title, description, accent = 'violet', icon, actions, children }) {
  if (hidden) return null;
  const accentClasses = ACCENTS[accent] || ACCENTS.violet;

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3 px-1">
        {/* Icon — smaller on mobile */}
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${accentClasses}`}>
          {typeof icon === 'string' ? (
            <span className="material-symbols-outlined text-xl sm:text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            {/* Title + description block */}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black font-headline text-brand-on-surface dark:text-brand-outline-variant leading-tight tracking-tight uppercase">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-brand-on-surface-variant/80 dark:text-brand-outline mt-1 font-label leading-relaxed max-w-3xl">
                  {description}
                </p>
              )}
            </div>

            {/* Actions: below description on mobile, right-aligned on desktop */}
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0 self-start sm:mt-0.5">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}