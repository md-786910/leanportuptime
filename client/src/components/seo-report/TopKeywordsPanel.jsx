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
      className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 border ${
        disabled
          ? 'border-brand-outline-variant text-brand-outline cursor-not-allowed dark:border-brand-outline dark:text-brand-on-surface-variant'
          : 'border-brand-outline-variant dark:border-brand-outline text-brand-on-surface dark:text-brand-outline-variant hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface'
      } font-label`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Manage Keywords
    </button>
  );
}

function Header({ canManage, onManage, manageDisabled }) {
  return (
    <div className="flex items-center justify-between mb-3 gap-3">
      <div className="flex items-baseline gap-2">
        <h4 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline uppercase tracking-wider font-label">
          Top 5 Keywords
        </h4>
        <span className="text-[10px] text-brand-outline font-label">Best SERP positions</span>
      </div>
      {canManage && <ManageButton onClick={onManage} disabled={manageDisabled} />}
    </div>
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

  if (isLoading) {
    return (
      <div>
        <Header {...headerProps} />
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div>
          <Header {...headerProps} />
          <p className="text-[11px] text-brand-outline text-center py-4 font-label">
            No keywords tracked yet. {canManage ? 'Click Manage Keywords to add some.' : 'Ask an admin to add keywords to track SERP positions.'}
          </p>
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
        <div>
          <Header {...headerProps} />
          <p className="text-[11px] text-brand-outline text-center py-4 font-label">
            No ranked keywords yet. Run a refresh in the details tab.
          </p>
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
      <div>
        <Header {...headerProps} />
        <table className="w-full text-xs font-label">
          <thead>
            <tr className="text-left text-brand-on-surface-variant dark:text-brand-outline border-b border-brand-outline-variant dark:border-brand-outline">
              <th className="py-2 px-2 font-medium">#</th>
              <th className="py-2 px-2 font-medium">Keyword</th>
              <th className="py-2 px-2 font-medium text-right">Position</th>
              <th className="py-2 px-2 font-medium text-right">Δ</th>
              <th className="py-2 px-2 font-medium text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((it, idx) => (
              <tr
                key={it.keyword}
                className="border-b border-brand-outline-variant dark:border-brand-outline last:border-b-0 hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/40"
              >
                <td className="py-2 px-2 text-brand-outline tabular-nums">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-brand-on-surface dark:text-brand-outline-variant">
                  {it.keyword}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  <span className={positionClass(it.position)}>
                    {it.position == null ? 'Not ranked' : it.position}
                  </span>
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  <DeltaCell position={it.position} previousPosition={it.previousPosition} />
                </td>
                <td className="py-2 px-2 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {fmt(it.searchVolume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
