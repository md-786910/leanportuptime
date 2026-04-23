export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {icon && <div className="mb-6 text-gray-300 dark:text-gray-700">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
