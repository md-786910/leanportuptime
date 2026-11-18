import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { PLANS } from '../utils/constants';
import { useAppSettings, useUpdateAppSettings } from '../hooks/useAppSettings';
import { useIsViewer, useIsAdmin } from '../hooks/useRole';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useBackups, useCreateBackup } from '../hooks/useBackups';
import { formatRelative, formatBytes } from '../utils/formatters';

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

function BackupCard() {
  const { data, isLoading, unavailable } = useBackups();
  const create = useCreateBackup();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hide entirely when the connected API server doesn't support backups.
  if (unavailable) return null;

  const busy = Boolean(data && ((data.pending && !data.stale) || data.running));
  const backups = data?.backups || [];
  const lastRun = data?.lastRun;

  const handleConfirm = () => {
    create.mutate(undefined, { onSettled: () => setConfirmOpen(false) });
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-1">Database Backup</h3>
          <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
            Automatic backup every 3 days. The 2 most recent backups are kept and older ones are deleted.
          </p>
        </div>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={busy || isLoading || create.isPending}
          className="flex-shrink-0"
        >
          {busy ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {data?.running ? 'Backing up…' : 'Queued…'}
            </>
          ) : (
            'Backup now'
          )}
        </Button>
      </div>

      {data?.stale && (
        <p className="mb-3 text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 font-label">
          The backup request hasn't been picked up. Check that the mongo-backup service is running.
        </p>
      )}
      {lastRun?.state === 'failed' && !busy && (
        <p className="mb-3 text-xs rounded-lg px-3 py-2 bg-rose-50 text-rose-700 font-label">
          Last backup failed {lastRun.finishedAt ? formatRelative(lastRun.finishedAt) : ''}{lastRun.message ? `: ${lastRun.message}` : ''}
        </p>
      )}

      <div className="divide-y divide-brand-outline-variant/40 text-sm">
        {isLoading ? (
          <p className="py-2 text-xs text-brand-on-surface-variant font-label">Loading…</p>
        ) : backups.length === 0 ? (
          <p className="py-2 text-xs text-brand-on-surface-variant font-label">No backups yet.</p>
        ) : (
          backups.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-brand-on-surface dark:text-brand-outline-variant truncate font-mono text-xs">{b.name}</p>
                <p className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
                  {new Date(b.createdAt).toLocaleString()} · {formatRelative(b.createdAt)}
                </p>
              </div>
              <span className="text-xs text-brand-on-surface-variant dark:text-brand-outline tabular-nums flex-shrink-0">{formatBytes(b.size)}</span>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Run backup now?"
        message={`This creates a full database backup now.${backups.length >= 2 ? " Only the 2 most recent backups are kept, so the oldest one will be deleted." : ""}`}
        confirmText="Backup now"
        variant="primary"
        isLoading={create.isPending}
      />
    </Card>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const plan = PLANS[user?.plan || 'free'];
  const isViewer = useIsViewer();
  const isAdmin = useIsAdmin();

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

      {isAdmin && <BackupCard />}

      <Card>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">Plan Details</h3>
        <div className="space-y-3 text-sm">
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
