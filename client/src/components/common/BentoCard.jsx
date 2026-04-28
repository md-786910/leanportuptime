// Card chrome used across the bento redesign.
// Reference: rounded-3xl, soft shadow, very faint border, white surface.
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function BentoCard({ children, className = '', padding = 'lg', ...rest }) {
  const p = PADDING[padding] ?? PADDING.lg;
  return (
    <div
      className={`bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl ${p} shadow-sm transition-all hover:shadow-md ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
