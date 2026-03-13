import { formatDaysRemaining } from '../../utils/formatters';

export default function SSLBadge({ ssl }) {
  if (!ssl || !ssl.validTo) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No SSL data</p>
        </div>
      </div>
    );
  }

  const days = ssl.daysRemaining;
  let colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  let iconColor = 'text-emerald-600';
  if (days <= 0) {
    colorClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    iconColor = 'text-red-600';
  } else if (days <= 14) {
    colorClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    iconColor = 'text-amber-600';
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg ${colorClass}`}>
      <svg className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <div>
        <p className="text-sm font-semibold">{days > 0 ? 'Certificate Valid' : 'Certificate Expired'}</p>
        <p className="text-xs">{formatDaysRemaining(days)} remaining</p>
      </div>
    </div>
  );
}
