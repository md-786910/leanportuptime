export default function Card({ children, className = '', padding = 'lg', noPadding = false, ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div
      className={`bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${
        !noPadding ? paddingClasses[padding] : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
