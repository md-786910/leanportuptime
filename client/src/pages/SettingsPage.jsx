import { useAuthStore } from '../store/authStore';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { PLANS } from '../utils/constants';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const plan = PLANS[user?.plan || 'free'];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <span className="text-gray-900 dark:text-gray-100">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-gray-900 dark:text-gray-100">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Plan</span>
            <Badge variant="info">{user?.plan || 'free'}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Plan Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Max Sites</span>
            <span className="text-gray-900 dark:text-gray-100">{plan.maxSites === Infinity ? 'Unlimited' : plan.maxSites}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Min Check Interval</span>
            <span className="text-gray-900 dark:text-gray-100">{plan.checkInterval / 1000}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Data Retention</span>
            <span className="text-gray-900 dark:text-gray-100">{plan.retention === Infinity ? 'Unlimited' : `${plan.retention} days`}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
