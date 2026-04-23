const statusMap = {
  up: {
    bg: 'bg-brand-secondary-container',
    text: 'text-brand-on-secondary-container',
    dot: 'bg-brand-secondary',
    border: 'border-brand-outline-variant',
  },
  down: {
    bg: 'bg-brand-error-container',
    text: 'text-brand-on-error-container',
    dot: 'bg-brand-error',
    border: 'border-brand-error',
  },
  degraded: {
    bg: 'bg-brand-tertiary-fixed',
    text: 'text-brand-on-tertiary-fixed',
    dot: 'bg-brand-tertiary',
    border: 'border-brand-tertiary-container',
  },
  pending: {
    bg: 'bg-brand-surface-container',
    text: 'text-brand-on-surface-variant',
    dot: 'bg-brand-outline',
    border: 'border-brand-outline-variant',
  },
};

export const getStatusColor = (status) => {
  return statusMap[status] || statusMap.pending;
};
