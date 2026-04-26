import { useSecurity, useSecurityScan } from '../../hooks/useSecurity';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import ScoreBar from './ScoreBar';
import SecurityCheckList from './SecurityCheckList';
import { formatDate } from '../../utils/formatters';

export default function SecurityPanel({ siteId }) {
  const { audit, isLoading } = useSecurity(siteId);
  const scanMutation = useSecurityScan(siteId);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-brand-surface-container-low/30 p-5 rounded-2xl border border-brand-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${audit?.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : audit?.score >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-on-surface dark:text-white font-headline leading-tight text-brand-on-surface uppercase tracking-tight">Vulnerability Intelligence</h2>
            {audit && <p className="text-[10px] font-bold text-brand-outline uppercase tracking-widest mt-1">Assessment completed: {formatDate(audit.scannedAt)}</p>}
          </div>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          onClick={() => scanMutation.mutate()} 
          isLoading={scanMutation.isPending}
          className="w-full sm:w-auto shadow-brand-primary/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Initialize Deep Scan
        </Button>
      </div>

      {audit ? (
        <div className="grid grid-cols-1 gap-8">
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
              <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-brand-on-surface dark:text-brand-outline uppercase tracking-[0.2em] mb-6 font-label">Global Health Index</h3>
              <ScoreBar
                score={audit.score}
                totalChecks={audit.totalChecks}
                passedChecks={audit.passedChecks}
                failedChecks={audit.failedChecks}
              />
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden border-brand-outline-variant/30 shadow-xl">
            <div className="p-5 border-b border-brand-outline-variant dark:border-brand-outline/10 flex justify-between items-center bg-brand-surface-container-low/20">
              <h3 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-widest font-headline">Audit Findings & Compliance</h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Pass
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Critical
                </span>
              </div>
            </div>
            <div className="p-0">
              <SecurityCheckList checks={audit.checks} />
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-brand-surface-container-low/20 rounded-3xl border-2 border-dashed border-brand-outline-variant/30">
          <div className="p-4 bg-brand-surface-container-high rounded-full mb-4">
            <svg className="h-12 w-12 text-brand-outline opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-brand-on-surface dark:text-white font-headline">No Vulnerability Data</h3>
          <p className="text-sm text-brand-outline mt-2 mb-8 max-w-xs text-center">Execute a comprehensive security scan to identify potential threat vectors.</p>
          <Button variant="primary" size="lg" onClick={() => scanMutation.mutate()} isLoading={scanMutation.isPending}>
            Run Security Audit
          </Button>
        </div>
      )}
    </div>
  );
}
