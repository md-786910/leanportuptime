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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-surface-container-low/30 p-4 rounded-2xl border border-brand-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${ssl?.validTo && new Date(ssl.validTo) > new Date() ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">SSL Security Status</h2>
            <SSLBadge ssl={ssl} />
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => sslCheck.mutate()}
          isLoading={sslCheck.isPending}
          className="w-full sm:w-auto shadow-brand-primary/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Certificate
        </Button>
      </div>

      {ssl && ssl.issuer && (
        <Card padding="none" className="overflow-hidden">
          <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/20 bg-brand-surface-container-lowest/50">
            <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Certificate Technical Details
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Common Name / Issuer</span>
                <span className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">{ssl.issuer}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Protocol version</span>
                <span className="text-sm font-mono font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg w-fit">{ssl.protocol || '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Encryption Cipher</span>
                <span className="text-xs font-mono text-brand-on-surface-variant break-all">{ssl.cipher || '—'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Issued On</span>
                  <span className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">{formatDate(ssl.validFrom)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Expires On</span>
                  <span className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">{formatDate(ssl.validTo)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">SHA-256 Fingerprint</span>
                <div className="p-3 bg-brand-surface-container-lowest dark:bg-brand-on-surface/10 rounded-xl border border-brand-outline-variant/30 font-mono text-[10px] break-all leading-relaxed text-brand-outline">
                  {ssl.fingerprint || '—'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/20 bg-brand-surface-container-lowest/50">
          <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Certificate Change History
          </h3>
        </div>
        <div className="p-0">
          {histLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <SSLHistoryList history={history} />
          )}
        </div>
      </Card>
    </div>
  );
}
