import Button from './Button';

export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 px-1">
      {/* Result count */}
      <p className="text-sm font-medium text-brand-on-surface dark:text-brand-outline text-center sm:text-left">
        Showing{' '}
        <span className="font-semibold font-label">{startItem}</span>
        {' '}to{' '}
        <span className="font-semibold font-label">{endItem}</span>
        {' '}of{' '}
        <span className="font-semibold font-label">{total}</span>
        {' '}results
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <span className="text-xs font-medium font-label text-brand-on-surface dark:text-brand-outline px-2 whitespace-nowrap">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
