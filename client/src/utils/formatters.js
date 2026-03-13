import { format, formatDistanceToNow } from 'date-fns';

export const formatResponseTime = (ms) => {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
};

export const formatUptime = (percent) => {
  if (percent == null) return '—';
  return `${parseFloat(percent).toFixed(2)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
};

export const formatRelative = (dateStr) => {
  if (!dateStr) return 'Never';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
};

export const formatDaysRemaining = (days) => {
  if (days == null) return '—';
  if (days <= 0) return 'Expired';
  if (days === 1) return '1 day';
  return `${days} days`;
};

export const formatBytes = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
