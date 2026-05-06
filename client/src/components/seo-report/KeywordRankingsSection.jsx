import { useState, useMemo } from 'react';
import Spinner from '../common/Spinner';
import {
  useKeywordsStatus,
  useRemoveKeyword,
  useRefreshKeywords,
} from '../../hooks/useKeywords';
import { useIsViewer } from '../../hooks/useRole';
import KeywordRankingsTable from './KeywordRankingsTable';
import ManageKeywordsModal from './ManageKeywordsModal';
import { findLocation, DEFAULT_LOCATION_CODE } from './keywordLocations';

// Header chip text: "Google Austria (AT)" — full country name plus the
// ISO-style country short code so admins can confirm at a glance which
// SERP each keyword is being checked against.
function googleLocationLabel(code, language) {
  const found = findLocation(code);
  if (found) return `Google ${found.label} (${found.short})`;
  if (code) return `Google location ${code}${language ? ` (${language})` : ''}`;
  return 'Google';
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
  const providerConfig = status?.providerConfig || { locationCode: DEFAULT_LOCATION_CODE, languageCode: 'de' };
  const maxKeywords = status?.maxKeywordsPerSite || 30;
  const quotaExhausted = quota.remaining <= 0;
  const providerNotConfigured = !providerInfo.configured;

  // Distinct locations actually used by tracked keywords. Falls back to the
  // provider default when the list is empty so admins still see a chip.
  const locationChips = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const code = it.locationCode ?? providerConfig.locationCode;
      const language = it.languageCode || providerConfig.languageCode;
      if (!map.has(code)) {
        map.set(code, { code, language, count: 0 });
      }
      map.get(code).count += 1;
    }
    if (map.size === 0) {
      map.set(providerConfig.locationCode, {
        code: providerConfig.locationCode,
        language: providerConfig.languageCode,
        count: 0,
      });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items, providerConfig.locationCode, providerConfig.languageCode]);

  const handleRefresh = () => {
    if (quotaExhausted || providerNotConfigured || refresh.isPending || items.length === 0) return;
    refresh.mutate();
  };

  return (
    <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {locationChips.map((chip) => (
            <span
              key={chip.code}
              className="text-[10px] font-bold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            >
              {googleLocationLabel(chip.code, chip.language)}
            </span>
          ))}
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline tabular-nums px-1.5 py-0.5 rounded bg-brand-surface-container-high">
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
              className="text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface dark:text-brand-outline-variant hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface font-label"
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

      {/* Provider-not-configured notice — viewers see the empty state; admins
          fall through to the table so they can still add keywords manually. */}
      {providerNotConfigured && isViewer ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface-container-high dark:bg-brand-on-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-headline font-bold mb-1">Provider Not Configured</p>
          <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant font-medium uppercase tracking-wider">
            Set <code>DATAFORSEO_EMAIL</code> and <code>DATAFORSEO_PASSWORD</code> in the server environment.
          </p>
        </div>
      ) : (
        <>
          {providerNotConfigured && !isViewer && (
            <div className="mx-6 mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-label">
                Provider not configured — automated refresh disabled
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-label">
                Set <code>DATAFORSEO_EMAIL</code> and <code>DATAFORSEO_PASSWORD</code> in the server environment to enable automatic ranking checks. You can still add and edit keywords manually.
              </p>
            </div>
          )}

          <KeywordRankingsTable
            items={items}
            isViewer={isViewer}
            onRemove={(item) => removeMutation.mutate({
              keyword: item.keyword,
              locationCode: item.locationCode ?? DEFAULT_LOCATION_CODE,
            })}
            removePending={removeMutation.isPending}
            themeKey={themeKey}
            siteId={siteId}
          />

          <div className="px-6 py-4 space-y-1">
            {status?.fetchError && (
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Last refresh warning: {status.fetchError}
              </p>
            )}
            {status?.lastFetchedAt && (
              <p className="text-[10px] font-bold text-brand-outline text-center uppercase tracking-wider">
                Last refreshed {new Date(status.lastFetchedAt).toLocaleString()} · Provider: {providerInfo.name}
              </p>
            )}
          </div>
        </>
      )}

      {!isViewer && (
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
