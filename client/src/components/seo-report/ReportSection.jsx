const ACCENTS = {
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function ReportSection({ title, description, accent = 'violet', icon, children }) {
  const accentClasses = ACCENTS[accent] || ACCENTS.violet;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 px-1">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClasses}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
