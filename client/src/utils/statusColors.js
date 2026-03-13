const statusMap = {
  up: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  down: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'border-red-300 dark:border-red-700',
  },
  degraded: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-300 dark:border-amber-700',
  },
  pending: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-300 dark:border-slate-700',
  },
};

export const getStatusColor = (status) => {
  return statusMap[status] || statusMap.pending;
};
