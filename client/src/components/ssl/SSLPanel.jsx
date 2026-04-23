import { useSSL, useSSLHistory, useSSLCheck } from '../../hooks/useSSL';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import SSLBadge from './SSLBadge';
import SSLHistoryList from './SSLHistoryList';
import { formatDate } from '../../utils/formatters';

export default function SSLPanel({ siteId }) {
  const { ssl, isLoading } = useSSL(siteId);
  const { history, isLoading: histLoading } = useSSLHistory(siteId);
  const sslCheck = useSSLCheck(siteId);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SSLBadge ssl={ssl} />
        </div>
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

      {ssl && ssl.issuer && (
        <Card>
          <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Certificate Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Issuer:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant">{ssl.issuer}</span></div>
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Protocol:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant">{ssl.protocol || '—'}</span></div>
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Valid From:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatDate(ssl.validFrom)}</span></div>
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Valid To:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant">{formatDate(ssl.validTo)}</span></div>
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Cipher:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant">{ssl.cipher || '—'}</span></div>
            <div><span className="text-brand-on-surface-variant dark:text-brand-outline">Fingerprint:</span> <span className="text-brand-on-surface dark:text-brand-outline-variant text-xs break-all font-label">{ssl.fingerprint || '—'}</span></div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3">Certificate History</h3>
        {histLoading ? <Spinner /> : <SSLHistoryList history={history} />}
      </Card>
    </div>
  );
}
