import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

const typeVariant = {
  down: 'danger',
  up: 'success',
  ssl_expiry: 'warning',
  security_alert: 'danger',
  degraded: 'warning',
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { notifications, meta, isLoading } = useNotifications({ page, limit: 20 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !notifications.length ? (
        <EmptyState title="No notifications" description="You'll see alerts here when site status changes." />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <div key={n._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={typeVariant[n.type] || 'neutral'}>{n.type}</Badge>
                    <Badge variant="neutral">{n.channel}</Badge>
                    {n.siteId && (
                      <Link to={`/sites/${n.siteId._id || n.siteId}`} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
                        {n.siteId.name || 'Site'}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{n.message}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <Badge variant={n.status === 'sent' ? 'success' : n.status === 'failed' ? 'danger' : 'neutral'}>
                    {n.status}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Pagination page={page} total={meta.total || 0} limit={20} onPageChange={setPage} />
    </div>
  );
}
