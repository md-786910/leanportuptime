const variants = {
  brand: 'bg-brand-primary-container text-brand-on-primary-container',
  success: 'bg-brand-secondary-container text-brand-on-secondary-container',
  warning: 'bg-brand-tertiary-fixed text-brand-on-tertiary-fixed',
  danger: 'bg-brand-error-container text-brand-on-error-container',
  neutral: 'bg-brand-surface-container-high text-brand-on-surface-variant',
};

export default function Badge({ children, variant = 'brand', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-label font-bold uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
