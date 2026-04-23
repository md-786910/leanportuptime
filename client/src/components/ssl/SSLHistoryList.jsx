import { formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function SSLHistoryList({ history }) {
  if (!history?.length) {
    return <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline text-center py-4">No SSL history</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-outline-variant dark:border-brand-outline">
            <th className="text-left py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline">Checked</th>
            <th className="text-left py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline">Issuer</th>
            <th className="text-left py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline">Expires</th>
            <th className="text-left py-2 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((cert) => (
            <tr key={cert._id} className="border-b border-brand-outline-variant dark:border-brand-outline">
              <td className="py-2 px-3 text-brand-on-surface dark:text-brand-outline">{formatDate(cert.checkedAt)}</td>
              <td className="py-2 px-3 text-brand-on-surface dark:text-brand-outline">{cert.issuer || '—'}</td>
              <td className="py-2 px-3 text-brand-on-surface dark:text-brand-outline">{formatDate(cert.validTo)}</td>
              <td className="py-2 px-3">
                <Badge variant={cert.isValid ? 'success' : 'danger'}>
                  {cert.isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
