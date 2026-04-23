export default function Card({ children, className = '', padding = 'lg', noPadding = false, ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <div
      className={`bg-brand-surface-container-lowest border border-brand-outline-variant rounded-xl shadow-lg ${ !noPadding ? paddingClasses[padding] : '' } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
