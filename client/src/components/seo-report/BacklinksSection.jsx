import { useState } from 'react';
import Spinner from '../common/Spinner';
import DateRangePicker from '../common/DateRangePicker';
import { themeColor } from './colorThemes';
import { useBacklinksStatus, useBacklinksRefresh } from '../../hooks/useBacklinks';
import { useIsViewer } from '../../hooks/useRole';
import BacklinksTable from './BacklinksTable';
import EditDomainAuthorityModal from './EditDomainAuthorityModal';
import BacklinksChangelogDrawer from './BacklinksChangelogDrawer';

// Small delta chip — renders current vs. previous for aggregate stats.
// `direction` flips the good/bad colour: 'higher-better' (default) means ↑ is good.
function DeltaChip({ current, previous, direction = 'higher-better' }) {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  const isUp = delta > 0;
  const isGood = direction === 'higher-better' ? isUp : !isUp;
  const cls = isGood
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold font-label px-1 py-0.5 rounded ${cls}`}>
      {isUp ? '↑' : '↓'}{Math.abs(delta).toLocaleString()}
    </span>
  );
}

const METRIC_LABELS = {
  domain_rank: 'Domain Rank',
  domain_authority: 'Domain Authority',
  citation_flow: 'Citation Flow',
  trust_flow: 'Trust Flow',
};

const PERIODS = [
  { key: '1m', label: '1 month', months: 1 },
  { key: '3m', label: '3 months', months: 3 },
  { key: '6m', label: '6 months', months: 6 },
  { key: '12m', label: '12 months', months: 12 },
  { key: 'custom', label: 'Custom', months: null },
];

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatMonthKey(key) {
  if (!key || key.length < 7) return key || '';
  const [y, m] = key.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_NAMES[idx] || m} ${y}`;
}
function monthKeyToDate(key, endOfMonth = false) {
  if (!key || key.length < 7) return null;
  const [y, m] = key.split('-').map(Number);
  if (endOfMonth) return new Date(y, m, 0);
  return new Date(y, (m || 1) - 1, 1);
}
function dateToMonthKey(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDayDate(d) {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Sums monthly buckets of history within a period. Returns null if not computable.
// Also reports whether the requested window extends beyond the stored months.
function sumPeriod(history, period, customFrom, customTo) {
  if (!history?.length) return null;
  const sorted = [...history].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const available = sorted.map((h) => h.monthKey);
  const minStored = available[0];
  const maxStored = available[available.length - 1];

  let start;
  let end;
  let requestedStart;
  if (period === 'custom') {
    if (!customFrom || !customTo || customFrom > customTo) return null;
    requestedStart = customFrom;
    start = customFrom;
    end = customTo;
  } else {
    const cfg = PERIODS.find((p) => p.key === period);
    end = maxStored;
    const firstIdx = Math.max(0, sorted.length - cfg.months);
    requestedStart = sorted[firstIdx].monthKey;
    start = requestedStart;
  }

  const slice = sorted.filter((h) => h.monthKey >= start && h.monthKey <= end);
  const totals = slice.reduce((acc, h) => ({
    newDomains: acc.newDomains + (h.newDomains || 0),
    lostDomains: acc.lostDomains + (h.lostDomains || 0),
    newBacklinks: acc.newBacklinks + (h.newBacklinks || 0),
    lostBacklinks: acc.lostBacklinks + (h.lostBacklinks || 0),
  }), { newDomains: 0, lostDomains: 0, newBacklinks: 0, lostBacklinks: 0 });

  const partial = requestedStart < minStored || end > maxStored;
  return { ...totals, months: slice.length, partial };
}

function daysAgo(date) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d < 1) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

export default function BacklinksSection({ siteId, themeKey, showTitle = true, variant = 'full' }) {
  const { status, isLoading } = useBacklinksStatus(siteId);
  const refresh = useBacklinksRefresh(siteId);
  const isViewer = useIsViewer();
  const [period, setPeriod] = useState('1m');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const [editDAOpen, setEditDAOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const Title = showTitle ? (
    <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant uppercase tracking-wider font-label">Domain Authority</h3>
  ) : null;

  if (isLoading) {
    return (
      <div>
        {showTitle && (
          <div className="mb-3 pb-2 border-b border-brand-outline-variant dark:border-brand-outline">{Title}</div>
        )}
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  // variant-specific early returns defined after data/derived values are computed below

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

  // Period-aware totals. `1m` continues to use the summary fields because DataForSEO
  // reports those as a rolling 30-day window (more current than the latest monthly bucket).
  const hasHistory = Array.isArray(data.history) && data.history.length > 0;
  const historyMonths = hasHistory
    ? [...new Set(data.history.map((h) => h.monthKey).filter(Boolean))].sort()
    : [];
  const customFromKey = dateToMonthKey(customFrom);
  const customToKey = dateToMonthKey(customTo);
  const periodTotals = hasHistory && period !== '1m'
    ? sumPeriod(data.history, period, customFromKey, customToKey)
    : null;
  const displayedNew = period === '1m'
    ? (data.newLinksLast30d ?? 0)
    : (periodTotals?.newDomains ?? null);
  const displayedLost = period === '1m'
    ? (data.lostLinksLast30d ?? 0)
    : (periodTotals?.lostDomains ?? null);
  const periodLabel = period === '1m'
    ? 'Last 30 days'
    : period === 'custom'
      ? (customFrom && customTo ? `${formatDayDate(customFrom)} → ${formatDayDate(customTo)}` : 'Pick a range')
      : (PERIODS.find((p) => p.key === period)?.label || '');

  // Empty state — never fetched
  if (!hasData) {
    // Domain-authority split variant stays silent when there is no data — the
    // Backlinks section below owns the "Fetch" call-to-action.
    if (variant === 'domain-authority') return null;

    return (
      <div>
        {variant === 'full' && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-outline-variant dark:border-brand-outline">
            {Title}
            {!isViewer && (
              <span className={`text-[10px] font-semibold font-label px-2 py-1 rounded ${quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline'} tabular-nums`}>
                {quota.used} / {quota.limit} this month
              </span>
            )}
          </div>
        )}
        {variant === 'backlinks' && !isViewer && (
          <div className="flex justify-end mb-3">
            <span className={`text-[10px] font-semibold font-label px-2 py-1 rounded ${quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline'} tabular-nums`}>
              {quota.used} / {quota.limit} this month
            </span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-brand-outline-variant dark:border-brand-outline">
          <svg className="w-10 h-10 text-brand-outline dark:text-brand-on-surface-variant mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {isViewer ? (
            <>
              <p className="text-xs font-semibold text-brand-on-surface-variant mb-1 font-label">No backlinks data available</p>
              <p className="text-[10px] text-brand-outline text-center max-w-[240px] font-label">Contact the site owner to fetch backlinks data.</p>
            </>
          ) : providerNotConfigured ? (
            <>
              <p className="text-xs font-semibold text-brand-on-surface-variant mb-1 font-label">Provider Not Configured</p>
              <p className="text-[10px] text-brand-outline text-center max-w-[240px] font-label">Set BACKLINKS_PROVIDER and credentials in server environment</p>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={quotaExhausted || refresh.isPending}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${ quotaExhausted ? 'bg-brand-surface-container-high text-brand-outline cursor-not-allowed dark:bg-brand-on-surface' : 'bg-brand-primary text-white hover:bg-brand-primary' } font-label`}
                title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
              >
                {refresh.isPending ? 'Fetching...' : 'Fetch Backlinks Data'}
              </button>
              <p className="text-[10px] text-brand-outline mt-2 font-label">Uses 1 of {quota.remaining} remaining refreshes this month</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Domain Authority variant — only the DA score card, centered and prominent.
  // Domain Authority variant — DA score + companion stats (ref domains, new/lost), period pills, refresh controls.
  if (variant === 'domain-authority') {
    return (
      <>
      <div>
        {!isViewer && (
          <div className="flex items-center justify-end gap-2 mb-3">
            {isStale && (
              <span className="text-[9px] font-semibold font-label px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Stale</span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded tabular-nums ${ quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline' } font-label`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : `${quota.remaining} refreshes remaining this month`}
            >
              {quota.used} / {quota.limit} this month
            </span>
            <button
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="text-xs font-medium px-3 py-1 rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1 font-label"
              title="View change history"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
            <button
              type="button"
              onClick={() => setEditDAOpen(true)}
              className="text-xs font-medium px-3 py-1 rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1 font-label"
              title="Edit Domain Authority stats"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleRefresh}
              disabled={quotaExhausted || refresh.isPending || providerNotConfigured}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${ quotaExhausted || providerNotConfigured ? 'bg-brand-surface-container-high text-brand-outline cursor-not-allowed dark:bg-brand-on-surface' : 'bg-brand-primary text-white hover:bg-brand-primary' } font-label`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : undefined}
            >
              <svg className={`w-3 h-3 ${refresh.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refresh.isPending ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        )}

        {hasHistory && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    if (p.key === 'custom' && !customFrom && historyMonths.length) {
                      setCustomFrom(monthKeyToDate(historyMonths[0]));
                      setCustomTo(monthKeyToDate(historyMonths[historyMonths.length - 1], true));
                    }
                    setPeriod(p.key);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${ period === p.key ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-brand-on-surface-variant hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface' } font-label`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangePicker
                  startDate={customFrom}
                  endDate={customTo}
                  onChange={([s, e]) => {
                    setCustomFrom(s);
                    setCustomTo(e);
                  }}
                  maxDate={new Date()}
                />
                {periodTotals?.partial && historyMonths.length > 0 && (
                  <span
                    className="text-[10px] text-amber-500 font-label"
                    title={`Stored history covers ${formatMonthKey(historyMonths[0])} – ${formatMonthKey(historyMonths[historyMonths.length - 1])}. Months outside this window contribute 0.`}
                  >
                    Partial — history stored from {formatMonthKey(historyMonths[0])}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">{scoreLabel}</span>
            <div className="flex items-center justify-center gap-1 my-1">
              <p className="text-2xl font-bold tabular-nums font-headline" style={{ color: themeColor(themeKey, 0) }}>{data.domainRank || 0}</p>
              <DeltaChip current={data.domainRank} previous={data.previousDomainRank} direction="higher-better" />
            </div>
            <span className="text-[9px] text-brand-outline">{providerDisplay}</span>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Backlinks</span>
            <div className="flex items-center justify-center gap-1 my-1">
              <p className="text-2xl font-bold text-brand-on-surface dark:text-white tabular-nums font-headline">{fmt(data.backlinksCount)}</p>
              <DeltaChip current={data.backlinksCount} previous={data.previousBacklinksCount} direction="higher-better" />
            </div>
            <span className="text-[9px] text-brand-outline">Total links</span>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Ref. Domains</span>
            <div className="flex items-center justify-center gap-1 my-1">
              <p className="text-2xl font-bold text-brand-on-surface dark:text-white tabular-nums font-headline">{fmt(data.referringDomains)}</p>
              <DeltaChip current={data.referringDomains} previous={data.previousReferringDomains} direction="higher-better" />
            </div>
            <span className="text-[9px] text-brand-outline">Unique sources</span>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">New Links</span>
            <div className="flex items-center justify-center gap-1 my-1">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-headline">
                {displayedNew == null ? '—' : `+${fmt(displayedNew)}`}
              </p>
              <DeltaChip current={data.newLinksLast30d} previous={data.previousNewLinksLast30d} direction="higher-better" />
            </div>
            <span className="text-[9px] text-brand-outline">{periodLabel}</span>
          </div>
          <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Lost Links</span>
            <div className="flex items-center justify-center gap-1 my-1">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums font-headline">
                {displayedLost == null ? '—' : `-${fmt(displayedLost)}`}
              </p>
              <DeltaChip current={data.lostLinksLast30d} previous={data.previousLostLinksLast30d} direction="lower-better" />
            </div>
            <span className="text-[9px] text-brand-outline">{periodLabel}</span>
          </div>
        </div>

        {data.domainRank === 0 && data.backlinksCount === 0 && data.referringDomains === 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-label">No backlinks data found for this domain</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-label">
                  The domain may be new or not yet indexed by {providerDisplay}. Large established sites typically have richer data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <EditDomainAuthorityModal
        isOpen={editDAOpen}
        onClose={() => setEditDAOpen(false)}
        siteId={siteId}
        current={data}
      />
      <BacklinksChangelogDrawer
        isOpen={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        siteId={siteId}
      />
      </>
    );
  }

  // Backlinks variant — the actual link list only (count/stats now live under Domain Authority).
  if (variant === 'backlinks') {
    return (
      <div>
        <BacklinksTable
          items={data.items || []}
          listFetchedAt={data.listFetchedAt}
          listFetchError={data.listFetchError}
          siteId={siteId}
        />

        {data.lastFetchedAt && (
          <p className="text-[10px] text-brand-outline mt-2 text-center font-label">
            Last updated {daysAgo(data.lastFetchedAt)} &middot; Provider: {providerDisplay}
          </p>
        )}
      </div>
    );
  }

  // Data present
  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-outline-variant dark:border-brand-outline">
        <div className="flex items-center gap-2">
          {Title}
          {isStale && (
            <span className="text-[9px] font-semibold font-label px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Stale</span>
          )}
        </div>
        {!isViewer && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded tabular-nums ${ quotaExhausted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline' } font-label`}
              title={quotaExhausted ? 'Monthly limit reached. Raise in Settings.' : `${quota.remaining} refreshes remaining this month`}
            >
              {quota.used} / {quota.limit} this month
            </span>
            <button
              onClick={handleRefresh}
              disabled={quotaExhausted || refresh.isPending || providerNotConfigured}
              className={`text-xs font-medium px-3 py-1 rounded transition-colors flex items-center gap-1 ${ quotaExhausted || providerNotConfigured ? 'bg-brand-surface-container-high text-brand-outline cursor-not-allowed dark:bg-brand-on-surface' : 'bg-brand-primary text-white hover:bg-brand-primary' } font-label`}
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

      {hasHistory && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  if (p.key === 'custom' && !customFrom && historyMonths.length) {
                    setCustomFrom(monthKeyToDate(historyMonths[0]));
                    setCustomTo(monthKeyToDate(historyMonths[historyMonths.length - 1], true));
                  }
                  setPeriod(p.key);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${ period === p.key ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-brand-on-surface-variant hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface' } font-label`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangePicker
                startDate={customFrom}
                endDate={customTo}
                onChange={([s, e]) => {
                  setCustomFrom(s);
                  setCustomTo(e);
                }}
                maxDate={new Date()}
              />
              {periodTotals?.partial && historyMonths.length > 0 && (
                <span
                  className="text-[10px] text-amber-500 font-label"
                  title={`Stored history covers ${formatMonthKey(historyMonths[0])} – ${formatMonthKey(historyMonths[historyMonths.length - 1])}. Months outside this window contribute 0.`}
                >
                  Partial — history stored from {formatMonthKey(historyMonths[0])}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">{scoreLabel}</span>
          <p className="text-2xl font-bold my-1 tabular-nums font-headline" style={{ color: themeColor(themeKey, 0) }}>{data.domainRank || 0}</p>
          <span className="text-[9px] text-brand-outline">{providerDisplay}</span>
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Backlinks</span>
          <p className="text-2xl font-bold text-brand-on-surface dark:text-white my-1 tabular-nums font-headline">{fmt(data.backlinksCount)}</p>
          <span className="text-[9px] text-brand-outline">Total links</span>
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Ref. Domains</span>
          <p className="text-2xl font-bold text-brand-on-surface dark:text-white my-1 tabular-nums font-headline">{fmt(data.referringDomains)}</p>
          <span className="text-[9px] text-brand-outline">Unique sources</span>
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">New Links</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 my-1 tabular-nums font-headline">
            {displayedNew == null ? '—' : `+${fmt(displayedNew)}`}
          </p>
          <span className="text-[9px] text-brand-outline">{periodLabel}</span>
        </div>
        <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-3 text-center">
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant uppercase">Lost Links</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 my-1 tabular-nums font-headline">
            {displayedLost == null ? '—' : `-${fmt(displayedLost)}`}
          </p>
          <span className="text-[9px] text-brand-outline">{periodLabel}</span>
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
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-label">No backlinks data found for this domain</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-label">
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
        siteId={siteId}
      />

      {data.lastFetchedAt && (
        <p className="text-[10px] text-brand-outline mt-2 text-center font-label">
          Last updated {daysAgo(data.lastFetchedAt)} &middot; Provider: {providerDisplay}
        </p>
      )}
    </div>
  );
}
