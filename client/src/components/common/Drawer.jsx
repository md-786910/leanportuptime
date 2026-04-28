import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export default function Drawer({ isOpen, onClose, title, children, width = 'lg', footer }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-on-surface/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full ${widthClasses[width]} bg-brand-surface-container-lowest dark:bg-brand-on-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-outline-variant dark:border-brand-outline/60 flex-shrink-0">
            <h3 className="text-base font-bold text-brand-on-surface dark:text-white tracking-tight font-headline">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface hover:text-brand-on-surface-variant dark:hover:text-brand-outline-variant transition-all active:scale-90"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3 border-t border-brand-outline-variant dark:border-brand-outline/60 flex-shrink-0 bg-brand-surface-container-low/50 dark:bg-brand-on-surface/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
