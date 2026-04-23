const variants = {
  primary: 'bg-brand-primary text-brand-on-primary hover:bg-brand-on-primary-fixed-variant shadow-lg shadow-brand-primary/10 active:scale-95 disabled:bg-brand-outline-variant',
  secondary: 'bg-brand-surface-container-lowest text-brand-on-surface border border-brand-outline-variant hover:bg-brand-surface-container-low shadow-sm active:scale-95',
  danger: 'bg-brand-error text-brand-on-error hover:opacity-90 shadow-lg shadow-brand-error/10 active:scale-95',
  ghost: 'bg-transparent text-brand-on-surface-variant hover:bg-brand-surface-container-low active:scale-95',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-bold',
  md: 'px-5 py-2.5 text-[13px] font-bold',
  lg: 'px-6 py-3 text-[14px] font-extrabold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-label transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
