import React from 'react';

const Input = React.forwardRef(({ label, error, id, type = 'text', className = '', ...rest }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-bold font-label text-brand-on-surface dark:text-brand-outline ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          ref={ref}
          id={id}
          type={type}
          className={`block w-full rounded-xl border bg-brand-surface-container-low/50 dark:bg-brand-on-surface/50 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:bg-brand-surface-container-lowest dark:focus:bg-brand-on-surface ${ error ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-500/10 focus:border-rose-500' : 'border-brand-outline-variant dark:border-brand-outline focus:ring-brand-primary-container/10 focus:border-brand-500/50 group-hover:border-brand-outline-variant dark:group-hover:border-brand-outline' } ${className}`}
          {...rest}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 ml-0.5 font-label">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
