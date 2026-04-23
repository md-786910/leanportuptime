export default function Card({ children, className = '', padding = 'lg', noPadding = false, ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm ${
        !noPadding ? paddingClasses[padding] : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
