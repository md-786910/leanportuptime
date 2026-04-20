import Spinner from '../common/Spinner';
import { themeColor } from './colorThemes';
import { useBacklinksStatus, useBacklinksRefresh } from '../../hooks/useBacklinks';
import { useIsViewer } from '../../hooks/useRole';
import BacklinksTable from './BacklinksTable';

const METRIC_LABELS = {
  domain_rank: 'Domain Rank',
  domain_authority: 'Domain Authority',
  citation_flow: 'Citation Flow',
  trust_flow: 'Trust Flow',
};

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function daysAgo(date) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d < 1) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

export default function BacklinksSection({ siteId, themeKey, showTitle = true }) {
  const { status, isLoading } = useBacklinksStatus(siteId);
  const refresh = useBacklinksRefresh(siteId);
  const isViewer = useIsViewer();

  const Title = showTitle ? (
    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Domain Authority</h3>
  ) : null;

  if (isLoading) {
    return (
      <div>
        {showTitle && (
          <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">{Title}</div>
        )}
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  const data = status?.backlinks || {};
  const quota = status?.quota || { used: 0, limit: 4, remaining: 4 };
  const providerInfo = status?.providerInfo || {};
  const hasData = status?.hasData;
  const isStale = status?.isStale;
  const quotaExhausted = quota.remaining <= 0;
  const providerNotConfigured = !providerInfo.configured;

  const scoreLabel = METRIC_LABELS[data.providerMetric] || 'Domain Score';
  const providerDisplay = data.providerName
    ? data.providerName.charAt(0).toUpperCase() + data.providerName.slice(1)
    : (providerInfo.name || 'unknown');

  const handleRefresh = () => {
    if (quotaExhausted || providerNotConfigured || refresh.isPending) return;
    refresh.mutate();
  };

  // Empty state — never fetched
  if (!hasData) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          {Title}
          {!isViewer && (
            <span className={`text-[10px] font-semibold px-2 py-1 rounded ${quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'} tabular-nums`}>
              {quota.used} / {quota.limit} this month
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {isViewer ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-1">No backlinks data available</p>
              <p className="text-[10px] text-gray-400 text-center max-w-[240px]">Contact the site owner to fetch backlinks data.</p>
            </>
          ) : providerNotConfigured ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-1">Provider Not Configured</p>
              <p className="text-[10px] text-gray-400 text-center max-w-[240px]">Set BACKLINKS_PROVIDER and credentials in server environment</p>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={quotaExhausted || refresh.isPending}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
                  quotaExhausted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
                title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
              >
                {refresh.isPending ? 'Fetching...' : 'Fetch Backlinks Data'}
              </button>
              <p className="text-[10px] text-gray-400 mt-2">Uses 1 of {quota.remaining} remaining refreshes this month</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Data present
  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {Title}
          {isStale && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Stale</span>
          )}
        </div>
        {!isViewer && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded tabular-nums ${
                quotaExhausted
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : `${quota.remaining} refreshes remaining this month`}
            >
              {quota.used} / {quota.limit} this month
            </span>
            <button
              onClick={handleRefresh}
              disabled={quotaExhausted || refresh.isPending || providerNotConfigured}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                quotaExhausted || providerNotConfigured
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
            >
              <svg className={`w-3 h-3 ${refresh.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refresh.isPending ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">{scoreLabel}</span>
          <p className="text-2xl font-bold my-1 tabular-nums" style={{ color: themeColor(themeKey, 0) }}>{data.domainRank || 0}</p>
          <span className="text-[9px] text-gray-400">{providerDisplay}</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Backlinks</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white my-1 tabular-nums">{fmt(data.backlinksCount)}</p>
          <span className="text-[9px] text-gray-400">Total links</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Ref. Domains</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white my-1 tabular-nums">{fmt(data.referringDomains)}</p>
          <span className="text-[9px] text-gray-400">Unique sources</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">New Links</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 my-1 tabular-nums">+{fmt(data.newLinksLast30d)}</p>
          <span className="text-[9px] text-gray-400">Last 30 days</span>
        </div>
      </div>

      {/* "No data found" notice when provider returned zeros */}
      {data.domainRank === 0 && data.backlinksCount === 0 && data.referringDomains === 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">No backlinks data found for this domain</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                The domain may be new or not yet indexed by {providerDisplay}. Large established sites typically have richer data.
              </p>
            </div>
          </div>
        </div>
      )}

      <BacklinksTable
        items={data.items || []}
        listFetchedAt={data.listFetchedAt}
        listFetchError={data.listFetchError}
      />

      {data.lastFetchedAt && (
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Last updated {daysAgo(data.lastFetchedAt)} &middot; Provider: {providerDisplay}
        </p>
      )}
    </div>
  );
}
