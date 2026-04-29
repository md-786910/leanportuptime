// Top-of-page header used by every route: title + optional description +
// breadcrumb + actions slot. Pairs with the AppLayout content area.
//
//   <PageHeader title="Dashboard" description="Overview of all your sites" />
//   <PageHeader title="Team" actions={<Button>Invite</Button>} />
//   <PageHeader breadcrumbs={[{ label: 'Sites', to: '/' }, { label: site.name }]}
//               title={site.name} actions={<RefreshButton />} />
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-[11px] font-label">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-1.5 min-w-0">
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="text-brand-on-surface-variant hover:text-brand-on-surface dark:text-brand-outline dark:hover:text-brand-outline-variant transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`truncate ${isLast ? 'text-brand-on-surface dark:text-brand-outline-variant font-semibold' : 'text-brand-on-surface-variant dark:text-brand-outline'}`}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <span className="text-brand-outline">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-brand-on-surface dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="font-body text-sm text-brand-on-surface-variant dark:text-brand-outline mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
