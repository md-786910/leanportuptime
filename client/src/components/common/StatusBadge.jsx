import { getStatusColor } from '../../utils/statusColors';

export default function StatusBadge({ status }) {
  const colors = getStatusColor(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} font-label`}>
      <span className={`h-2 w-2 rounded-full ${colors.dot} ${status === 'down' ? 'animate-pulse' : ''}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  );
}
