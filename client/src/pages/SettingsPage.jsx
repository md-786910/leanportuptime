import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { PLANS } from '../utils/constants';
import { useAppSettings, useUpdateAppSettings } from '../hooks/useAppSettings';
import { useIsViewer } from '../hooks/useRole';

function BacklinksLimitCard() {
  const { settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (settings?.backlinksMonthlyLimit != null) {
      setValue(String(settings.backlinksMonthlyLimit));
    }
  }, [settings?.backlinksMonthlyLimit]);

  const handleSave = () => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 1000) return;
    update.mutate({ backlinksMonthlyLimit: n });
  };

  const unchanged = settings && String(settings.backlinksMonthlyLimit) === value;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Backlinks Refresh Limit</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Controls how many times per calendar month each site can refresh its backlinks data.
        Resets automatically on the 1st of each month. Raise this if you need more refreshes.
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Refreshes per site / month</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <Button
          onClick={handleSave}
          isLoading={update.isPending}
          disabled={unchanged || update.isPending || isLoading || !value}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const plan = PLANS[user?.plan || 'free'];
  const isViewer = useIsViewer();

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

      {!isViewer && <BacklinksLimitCard />}

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
