const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
};

export default function Card({ children, className = '', padding = 'md', onClick }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
