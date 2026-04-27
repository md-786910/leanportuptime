import { useState } from 'react';
import Spinner from '../common/Spinner';
import {
  useKeywordsStatus,
  useRemoveKeyword,
  useRefreshKeywords,
} from '../../hooks/useKeywords';
import { useIsViewer } from '../../hooks/useRole';
import KeywordRankingsTable from './KeywordRankingsTable';
import ManageKeywordsModal from './ManageKeywordsModal';

function prettyLocation(locationCode, languageCode) {
  if (locationCode === 2276) return `Google Germany (${languageCode || 'de'})`;
  return `location ${locationCode} (${languageCode || 'en'})`;
}

export default function KeywordRankingsSection({ siteId, themeKey }) {
  const { status, isLoading } = useKeywordsStatus(siteId);
  const removeMutation = useRemoveKeyword(siteId);
  const refresh = useRefreshKeywords(siteId);
  const isViewer = useIsViewer();
  const [manageOpen, setManageOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  const items = status?.items || [];
  const quota = status?.quota || { used: 0, limit: 4, remaining: 4 };
  const providerInfo = status?.providerInfo || {};
  const providerConfig = status?.providerConfig || { locationCode: 2276, languageCode: 'de' };
  const maxKeywords = status?.maxKeywordsPerSite || 30;
  const quotaExhausted = quota.remaining <= 0;
  const providerNotConfigured = !providerInfo.configured;

  const handleRefresh = () => {
    if (quotaExhausted || providerNotConfigured || refresh.isPending || items.length === 0) return;
    refresh.mutate();
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium font-label uppercase">
            {prettyLocation(providerConfig.locationCode, providerConfig.languageCode)}
          </span>
          <span className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant font-label">
            {items.length} / {maxKeywords} keywords
          </span>
        </div>
        {!isViewer && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded tabular-nums ${ quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline' } font-label`}
              title={
                quotaExhausted
                  ? 'Monthly limit reached. Raise in Settings.'
                  : `${quota.remaining} refreshes remaining this month`
              }
            >
              {quota.used} / {quota.limit} this month
            </span>
            <button
              onClick={() => setManageOpen(true)}
              disabled={providerNotConfigured}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 border ${ providerNotConfigured ? 'border-brand-outline-variant text-brand-outline cursor-not-allowed dark:border-brand-outline dark:text-brand-on-surface-variant' : 'border-brand-outline-variant dark:border-brand-outline text-brand-on-surface dark:text-brand-outline-variant hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface' } font-label`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Manage Keywords
            </button>
            <button
              onClick={handleRefresh}
              disabled={quotaExhausted || refresh.isPending || providerNotConfigured || items.length === 0}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${ quotaExhausted || providerNotConfigured || items.length === 0 ? 'bg-brand-surface-container-high text-brand-outline cursor-not-allowed dark:bg-brand-on-surface' : 'bg-brand-primary text-white hover:bg-brand-primary' } font-label`}
              title={
                quotaExhausted
                  ? 'Monthly limit reached. Raise in Settings.'
                  : items.length === 0
                    ? 'Add a keyword first'
                    : undefined
              }
            >
              <svg className={`w-3 h-3 ${refresh.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refresh.isPending ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      {/* Provider-not-configured empty state */}
      {providerNotConfigured ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <svg className="w-10 h-10 text-brand-outline dark:text-brand-on-surface-variant mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-xs font-semibold text-brand-on-surface-variant mb-1 font-label">Provider Not Configured</p>
          <p className="text-[10px] text-brand-outline text-center max-w-[280px] font-label">
            Set <code>DATAFORSEO_EMAIL</code> and <code>DATAFORSEO_PASSWORD</code> in the server environment.
          </p>
        </div>
      ) : (
        <>
          <KeywordRankingsTable
            items={items}
            isViewer={isViewer}
            onRemove={(keyword) => removeMutation.mutate(keyword)}
            removePending={removeMutation.isPending}
            themeKey={themeKey}
            siteId={siteId}
          />

          {status?.fetchError && (
            <p className="text-[10px] text-amber-500 mt-2 font-label">
              Last refresh warning: {status.fetchError}
            </p>
          )}
          {status?.lastFetchedAt && (
            <p className="text-[10px] text-brand-outline mt-2 text-center font-label">
              Last refreshed {new Date(status.lastFetchedAt).toLocaleString()} · Provider: {providerInfo.name}
            </p>
          )}
        </>
      )}

      {!isViewer && !providerNotConfigured && (
        <ManageKeywordsModal
          isOpen={manageOpen}
          onClose={() => setManageOpen(false)}
          siteId={siteId}
          items={items}
          maxKeywords={maxKeywords}
        />
      )}
    </div>
  );
}
