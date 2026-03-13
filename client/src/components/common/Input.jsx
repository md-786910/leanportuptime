import React from 'react';

const Input = React.forwardRef(({ label, error, id, type = 'text', className = '', ...rest }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-100 ${
          error
            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
