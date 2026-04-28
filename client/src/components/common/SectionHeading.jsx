// Page-level heading from the reference HTML.
// Manrope extrabold title + Inter sub-text + actions slot on the right.
export default function SectionHeading({ title, description, descriptionAccent, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${className}`}>
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-brand-on-surface dark:text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="font-body text-brand-on-surface-variant dark:text-brand-outline mt-1">
            {description}
            {descriptionAccent && (
              <>
                {' '}
                <span className="font-semibold text-brand-primary">{descriptionAccent}</span>
              </>
            )}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
