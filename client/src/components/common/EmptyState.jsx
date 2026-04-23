export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {icon && <div className="mb-6 text-brand-outline dark:text-brand-on-surface">{icon}</div>}
      <h3 className="text-xl font-semibold text-brand-on-surface dark:text-brand-outline-variant">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-brand-on-surface-variant dark:text-brand-outline max-w-md">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
