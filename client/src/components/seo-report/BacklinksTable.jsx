import { useMemo, useState } from 'react';

const PAGE_SIZES = [10, 25, 50];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function pathOf(url) {
  try {
    const u = new URL(url);
    const p = u.pathname + u.search;
    return p === '/' ? '/' : p;
  } catch {
    return url;
  }
}

function TypeBadge({ type }) {
  const cls =
    type === 'image'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : type === 'redirect'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : type === 'canonical' || type === 'alternate'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>
      {type || 'anchor'}
    </span>
  );
}

function FollowBadge({ doFollow }) {
  return doFollow ? (
    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      Follow
    </span>
  ) : (
    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
      NoFollow
    </span>
  );
}

export default function BacklinksTable({ items = [], listFetchedAt, listFetchError }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState(false);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  if (items.length === 0 && !listFetchError) {
    return (
      <div className="mt-5 p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">No individual backlinks recorded yet.</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Click Refresh to fetch the link list.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Backlinks</h4>
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {items.length}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
          {expanded ? 'Hide' : 'Show'} list
        </span>
      </button>

      {!expanded && listFetchError && (
        <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Backlink list couldn&apos;t be refreshed — showing last known data.
          </p>
        </div>
      )}

      {!expanded && listFetchedAt && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
          Links last updated {timeAgo(listFetchedAt)}
        </p>
      )}

      {!expanded ? null : (
      <div className="mt-3">
      {listFetchError && (
        <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Backlink list couldn&apos;t be refreshed — showing last known data. ({listFetchError})
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-8">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Source</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">Anchor</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden lg:table-cell">Target</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">First Seen</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const index = (safePage - 1) * pageSize + i + 1;
              return (
                <tr key={`${r.sourceUrl}-${i}`} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 px-3 text-gray-400 dark:text-gray-500 tabular-nums">{index}</td>
                  <td className="py-2 px-3 max-w-[280px]">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline truncate"
                      title={r.sourceUrl}
                    >
                      <span className="truncate">{hostOf(r.sourceUrl)}</span>
                      <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {r.domainFromRank > 0 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        DR {r.domainFromRank}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 max-w-[220px] hidden md:table-cell">
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate block" title={r.anchor}>
                      {r.anchor || <span className="text-gray-300 dark:text-gray-600 italic">— no anchor —</span>}
                    </span>
                  </td>
                  <td className="py-2 px-3 max-w-[180px] hidden lg:table-cell">
                    <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400 truncate block" title={r.targetUrl}>
                      {pathOf(r.targetUrl)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={r.linkType} />
                      <FollowBadge doFollow={r.doFollow} />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-gray-500 dark:text-gray-400 hidden sm:table-cell tabular-nums">
                    {timeAgo(r.firstSeen)}
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                    {timeAgo(r.lastSeen)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {listFetchedAt && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
          Links last updated {timeAgo(listFetchedAt)} · up to 100 links tracked per refresh
        </p>
      )}
      </div>
      )}
    </div>
  );
}
