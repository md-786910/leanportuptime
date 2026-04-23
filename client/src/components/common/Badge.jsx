const variants = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
  neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-400/10 dark:text-slate-400',
};

export default function Badge({ children, variant = 'brand', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
