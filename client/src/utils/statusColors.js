const statusMap = {
  up: {
    bg: 'bg-emerald-50 dark:bg-emerald-400/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  down: {
    bg: 'bg-rose-50 dark:bg-rose-400/10',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
  degraded: {
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  pending: {
    bg: 'bg-slate-100 dark:bg-white/5',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
};

export const getStatusColor = (status) => {
  return statusMap[status] || statusMap.pending;
};
