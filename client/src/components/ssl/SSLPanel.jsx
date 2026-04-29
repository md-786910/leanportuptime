import { useSSL, useSSLHistory, useSSLCheck } from '../../hooks/useSSL';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import KpiCard from '../common/KpiCard';
import SectionHeader from '../common/SectionHeader';
import SSLBadge from './SSLBadge';
import SSLHistoryList from './SSLHistoryList';
import { formatDate } from '../../utils/formatters';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function expiryAccent(days) {
  if (days == null) return 'sky';
  if (days < 0) return 'rose';
  if (days <= 14) return 'rose';
  if (days <= 30) return 'amber';
  return 'emerald';
}

function expiryText(days) {
  if (days == null) return '—';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  return `${days}d remaining`;
}

export default function SSLPanel({ siteId }) {
  const { ssl, isLoading } = useSSL(siteId);
  const { history, isLoading: histLoading } = useSSLHistory(siteId);
  const sslCheck = useSSLCheck(siteId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const days = daysUntil(ssl?.validTo);

  return (
    <div className="space-y-6">
      {/* Status row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SSLBadge ssl={ssl} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => sslCheck.mutate()}
          isLoading={sslCheck.isPending}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Check SSL
        </Button>
      </div>

      {/* KPI strip */}
      {ssl && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Status"
            value={ssl.valid === true ? 'Valid' : ssl.valid === false ? 'Invalid' : 'Unknown'}
            hint={ssl.valid === false ? 'Action required' : 'Certificate active'}
            accent={ssl.valid === true ? 'emerald' : ssl.valid === false ? 'rose' : 'sky'}
          />
          <KpiCard
            label="Days Remaining"
            value={days != null ? Math.max(days, 0) : '—'}
            hint={expiryText(days)}
            accent={expiryAccent(days)}
          />
          <KpiCard
            label="Issuer"
            value={ssl.issuer || '—'}
            hint="Certificate authority"
            accent="indigo"
          />
          <KpiCard
            label="Protocol"
            value={ssl.protocol || '—'}
            hint={ssl.cipher ? ssl.cipher.split('-')[0] : 'TLS version'}
            accent="violet"
          />
        </div>
      )}

      {/* Certificate Details */}
      {ssl && ssl.issuer && (
        <div>
          <SectionHeader number={1} title="Certificate Details" accent="indigo" description="Issuer, validity window, cipher and fingerprint" />
          <Card>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Issuer</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-medium">{ssl.issuer}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Protocol</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-medium tabular-nums">{ssl.protocol || '—'}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Valid From</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-medium tabular-nums">{formatDate(ssl.validFrom)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Valid To</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-medium tabular-nums">{formatDate(ssl.validTo)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Cipher</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-medium font-mono text-xs">{ssl.cipher || '—'}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-outline dark:text-brand-on-surface-variant">Fingerprint</dt>
                <dd className="text-brand-on-surface dark:text-brand-outline-variant font-mono text-xs break-all">{ssl.fingerprint || '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* History */}
      <div>
        <SectionHeader number={2} title="Certificate History" accent="violet" description="Recent issuance and rotation events" />
        <Card>
          {histLoading ? <Spinner /> : <SSLHistoryList history={history} />}
        </Card>
      </div>
    </div>
  );
}
