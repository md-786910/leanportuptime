import { useState } from 'react';
import Spinner from '../common/Spinner';
import { useKeywordsStatus } from '../../hooks/useKeywords';
import { useIsViewer } from '../../hooks/useRole';
import { fmt, positionClass, DeltaCell } from './KeywordRankingsTable';
import ManageKeywordsModal from './ManageKeywordsModal';

function sortByPosition(items) {
  return [...items].sort((a, b) => {
    const ap = a.position;
    const bp = b.position;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;
    if (bp == null) return -1;
    return ap - bp;
  });
}

function ManageButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
        disabled
          ? 'bg-brand-surface-container-low text-brand-outline cursor-not-allowed dark:bg-brand-on-surface/40 dark:text-brand-on-surface-variant'
          : 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-md shadow-sm'
      } font-label`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Manage Keywords
    </button>
  );
}

function Header({ canManage, onManage, manageDisabled }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-outline-variant/60 dark:border-brand-outline/60 mb-2 pb-2">
      <div className="flex items-center gap-3">
        <h4 className="text-[18px] font-bold text-brand-on-surface dark:text-brand-outline-variant tracking-tight font-headline">
          Top 5 Keywords
        </h4>
      </div>
      {canManage && <ManageButton onClick={onManage} disabled={manageDisabled} />}
    </div>
  );
}

function RankBadge({ rank }) {
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold font-headline tabular-nums`}>
      {rank}
    </span>
  );
}

function PositionPill({ position }) {
  if (position == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-label bg-brand-surface-container-high dark:bg-brand-on-surface/60 text-brand-outline">
        Not ranked
      </span>
    );
  }
  const cls = position <= 3
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
    : position <= 10
      ? 'bg-emerald-50/60 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:ring-emerald-500/10'
      : position <= 30
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-[12px] font-bold font-headline tabular-nums ${cls}`}>
      {position}
    </span>
  );
}

export default function TopKeywordsPanel({ siteId }) {
  const { status, isLoading } = useKeywordsStatus(siteId);
  const isViewer = useIsViewer();
  const [manageOpen, setManageOpen] = useState(false);

  const items = status?.items || [];
  const sorted = sortByPosition(items).slice(0, 5);
  const topHasRanked = sorted.some((it) => it.position != null);
  const providerInfo = status?.providerInfo || {};
  const providerNotConfigured = !providerInfo.configured;
  const maxKeywords = status?.maxKeywordsPerSite || 30;
  const canManage = !isViewer;

  const headerProps = {
    canManage,
    onManage: () => setManageOpen(true),
    manageDisabled: providerNotConfigured,
  };

  const panelClass = '';

  if (isLoading) {
    return (
      <div className={panelClass}>
        <Header {...headerProps} />
        <div className="flex justify-center py-10">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  const renderEmpty = (message) => (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-surface-container-high dark:bg-brand-on-surface/60 flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-brand-outline dark:text-brand-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label max-w-[280px]">{message}</p>
    </div>
  );

  if (items.length === 0) {
    return (
      <>
        <div className={panelClass}>
          <Header {...headerProps} />
          {renderEmpty(canManage ? 'No keywords tracked yet. Click Manage Keywords to start tracking SERP positions.' : 'No keywords tracked yet. Ask an admin to add keywords to track SERP positions.')}
        </div>
        {canManage && !providerNotConfigured && (
          <ManageKeywordsModal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            siteId={siteId}
            items={items}
            maxKeywords={maxKeywords}
          />
        )}
      </>
    );
  }

  if (!topHasRanked) {
    return (
      <>
        <div className={panelClass}>
          <Header {...headerProps} />
          {renderEmpty('No ranked keywords yet. Run a refresh in the details tab.')}
        </div>
        {canManage && !providerNotConfigured && (
          <ManageKeywordsModal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            siteId={siteId}
            items={items}
            maxKeywords={maxKeywords}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={panelClass}>
        <Header {...headerProps} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-label">
            <thead>
              <tr className="text-left bg-brand-surface-container-low/50 dark:bg-brand-on-surface/40">
                <th className="py-2.5 px-5 font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline w-12">Rank</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline">Keyword</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline text-right">Position</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline text-right">Trend</th>
                <th className="py-2.5 px-5 font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it, idx) => (
                <tr
                  key={it.keyword}
                  className="border-t border-brand-outline-variant/40 dark:border-brand-outline/40 hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/40 transition-colors"
                >
                  <td className="py-3 px-5">
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td className="py-3 px-3 font-semibold text-brand-on-surface dark:text-white truncate max-w-0">
                    {it.keyword}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <PositionPill position={it.position} />
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <DeltaCell position={it.position} previousPosition={it.previousPosition} />
                  </td>
                  <td className="py-3 px-5 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-semibold">
                    {fmt(it.searchVolume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {canManage && !providerNotConfigured && (
        <ManageKeywordsModal
          isOpen={manageOpen}
          onClose={() => setManageOpen(false)}
          siteId={siteId}
          items={items}
          maxKeywords={maxKeywords}
        />
      )}
    </>
  );
}
