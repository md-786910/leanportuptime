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
      <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-1">Backlinks Refresh Limit</h3>
      <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline mb-4 font-label">
        Controls how many times per calendar month each site can refresh its backlinks data.
        Resets automatically on the 1st of each month. Raise this if you need more refreshes.
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-brand-on-surface-variant dark:text-brand-outline mb-1 font-label">Refreshes per site / month</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant focus:ring-2 focus:ring-brand-primary-container focus:border-brand-500"
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
      <h1 className="text-2xl font-bold text-brand-on-surface dark:text-white font-headline">Settings</h1>

      <Card>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Name</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Email</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Plan</span>
            <Badge variant="info">{user?.plan || 'free'}</Badge>
          </div>
        </div>
      </Card>

      {!isViewer && <BacklinksLimitCard />}

      <Card>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">Plan Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Max Sites</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{plan.maxSites === Infinity ? 'Unlimited' : plan.maxSites}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Min Check Interval</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{plan.checkInterval / 1000}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-on-surface-variant dark:text-brand-outline">Data Retention</span>
            <span className="text-brand-on-surface dark:text-brand-outline-variant">{plan.retention === Infinity ? 'Unlimited' : `${plan.retention} days`}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
