export default function Card({ children, className = '', padding = 'lg', noPadding = false, ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <div
      className={`bg-white dark:bg-brand-inverse-surface border border-brand-outline-variant/60 dark:border-white/10 rounded-xl shadow-card ${ !noPadding ? paddingClasses[padding] : '' } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
