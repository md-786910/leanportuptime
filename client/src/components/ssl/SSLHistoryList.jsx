import { formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function SSLHistoryList({ history }) {
  if (!history?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No SSL history</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Checked</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Issuer</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Expires</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((cert) => (
            <tr key={cert._id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{formatDate(cert.checkedAt)}</td>
              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{cert.issuer || '—'}</td>
              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{formatDate(cert.validTo)}</td>
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
