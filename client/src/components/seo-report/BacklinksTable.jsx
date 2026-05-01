import { useMemo, useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { useIsAdmin } from '../../hooks/useRole';
import { useRemoveBacklinkItem, useRemovePaidBacklinkItem } from '../../hooks/useBacklinks';
import AddBacklinkItemModal from './AddBacklinkItemModal';
import EditBacklinkItemModal from './EditBacklinkItemModal';

const PAGE_SIZES = [10, 25, 50];

function getRowSortTimestamp(row) {
  const candidates = [row.updatedAt, row.lastSeen, row.firstSeen];
  for (const value of candidates) {
    if (!value) continue;
    const ts = new Date(value).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  if (typeof row._id === 'string' && row._id.length >= 8) {
    const ts = parseInt(row._id.slice(0, 8), 16) * 1000;
    if (Number.isFinite(ts)) return ts;
  }
  return 0;
}

function sortBacklinkRows(items, isPaid) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (!isPaid) {
        const aManual = a.item.source === 'manual' ? 1 : 0;
        const bManual = b.item.source === 'manual' ? 1 : 0;
        if (aManual !== bManual) return bManual - aManual;
      }

      const timeDiff = getRowSortTimestamp(b.item) - getRowSortTimestamp(a.item);
      if (timeDiff !== 0) return timeDiff;
      return b.index - a.index;
    })
    .map(({ item }) => item);
}

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
      : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline';
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cls} font-label`}>
      {type || 'anchor'}
    </span>
  );
}

function FollowBadge({ doFollow }) {
  return doFollow ? (
    <span className="text-[9px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      Follow
    </span>
  ) : (
    <span className="text-[9px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-on-surface-variant">
      NoFollow
    </span>
  );
}

function ManualBadge() {
  return (
    <span className="text-[9px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
      Manual
    </span>
  );
}

function PrBadge() {
  return (
    <span className="text-[9px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
      PR
    </span>
  );
}

export default function BacklinksTable({ items = [], listFetchedAt, listFetchError, siteId, kind = 'seo', title }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  const isPaid = kind === 'paid';
  const headingLabel = title || (isPaid ? 'Paid Backlinks' : 'Backlinks');
  const addLabel = isPaid ? 'Add paid backlink' : 'Add backlink';

  const isAdmin = useIsAdmin();
  const seoRemove = useRemoveBacklinkItem(siteId);
  const paidRemove = useRemovePaidBacklinkItem(siteId);
  const removeMutation = isPaid ? paidRemove : seoRemove;
  const orderedItems = useMemo(() => sortBacklinkRows(items, isPaid), [items, isPaid]);

  // Paid lists are always small and manually maintained — no pagination needed.
  const showPagination = !isPaid && orderedItems.length > pageSize;
  const totalPages = Math.max(1, Math.ceil(orderedItems.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    if (isPaid) return orderedItems;
    const start = (safePage - 1) * pageSize;
    return orderedItems.slice(start, start + pageSize);
  }, [orderedItems, safePage, pageSize, isPaid]);

  if (items.length === 0 && !listFetchError) {
    return (
      <>
        <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-headline text-brand-on-surface dark:text-white">{headingLabel}</h3>
              <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant tabular-nums px-1.5 py-0.5 rounded bg-brand-surface-container-high">
                0
              </span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="text-xs font-medium px-3 py-1 rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1 font-label"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {addLabel}
              </button>
            )}
          </div>
          <div className="p-10 text-center">
            <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-headline font-bold">
              {isPaid ? 'No paid backlinks recorded yet.' : 'No individual backlinks recorded yet.'}
            </p>
            <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant mt-1 font-medium uppercase tracking-wider">
              {isPaid ? 'Use “Add paid backlink” to track press-release or paid placements.' : 'Click Refresh to fetch the link list, or add one manually.'}
            </p>
          </div>
        </div>
        <AddBacklinkItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} siteId={siteId} kind={kind} />
      </>
    );
  }

  return (
    <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold font-headline text-brand-on-surface dark:text-white">{headingLabel}</h3>
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant tabular-nums px-1.5 py-0.5 rounded bg-brand-surface-container-high">
            {orderedItems.length}
          </span>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="text-xs font-medium px-3 py-1 rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1 font-label"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        )}
      </div>

      {listFetchError && (
        <div className="mx-6 mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-bold font-headline">
            Backlink list couldn&apos;t be refreshed — showing last known data. ({listFetchError})
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-brand-surface-container-low border-b-0">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-8">#</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Source</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant hidden md:table-cell">Anchor</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant hidden lg:table-cell">Target</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Type</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right hidden sm:table-cell">First Seen</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Last Seen</th>
              {isAdmin && (
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-16" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-surface-container dark:divide-brand-outline/30">
            {rows.map((r, i) => {
              const index = isPaid ? i + 1 : ((safePage - 1) * pageSize + i + 1);
              return (
                <tr key={r._id || `${r.sourceUrl}-${i}`} className="group hover:bg-brand-surface-container-low/50 dark:hover:bg-brand-on-surface/30 transition-colors">
                  <td className="px-6 py-4 text-brand-outline tabular-nums text-xs">{index}</td>
                  <td className="px-6 py-4 max-w-[280px]">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-sm font-bold font-headline text-brand-primary dark:text-brand-400 hover:underline truncate"
                      title={r.sourceUrl}
                    >
                      <span className="truncate">{hostOf(r.sourceUrl)}</span>
                      <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {r.domainFromRank > 0 && (
                      <div className="text-[10px] font-bold text-brand-outline uppercase tracking-wider mt-0.5">
                        DA {r.domainFromRank}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-[220px] hidden md:table-cell">
                    <span className="text-sm font-medium text-brand-on-surface dark:text-brand-outline truncate block" title={r.anchor}>
                      {r.anchor || <span className="text-brand-outline">—</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[180px] hidden lg:table-cell">
                    <span className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline truncate block" title={r.targetUrl}>
                      {pathOf(r.targetUrl)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* {isPaid && <PrBadge />} */}
                      <TypeBadge type={r.linkType} />
                      <FollowBadge doFollow={r.doFollow} />
                      {/* {!isPaid && r.source === 'manual' && <ManualBadge />} */}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline hidden sm:table-cell tabular-nums">
                    {timeAgo(r.firstSeen) || <span className="text-brand-outline">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                    {timeAgo(r.lastSeen) || <span className="text-brand-outline">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingItem(r)}
                          title="Edit backlink"
                          className="p-1.5 rounded-lg text-brand-outline hover:text-brand-primary hover:bg-brand-surface-container-high transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingRemove(r)}
                          title="Remove backlink"
                          className="p-1.5 rounded-lg text-brand-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="px-6 py-4 border-t border-brand-surface-container flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 text-xs font-bold rounded bg-brand-surface-container-high border-none text-brand-on-surface focus:ring-2 focus:ring-brand-primary/20"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-brand-on-surface-variant tabular-nums uppercase tracking-wider">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-lg text-brand-on-surface-variant hover:bg-brand-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg text-brand-on-surface-variant hover:bg-brand-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {listFetchedAt && (
        <div className="px-6 py-4 bg-brand-surface-container-low/30 text-center">
          <p className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">
            Links last updated {timeAgo(listFetchedAt)} · up to 100 links tracked per refresh
          </p>
        </div>
      )}

      <AddBacklinkItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} siteId={siteId} kind={kind} />
      <EditBacklinkItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        siteId={siteId}
        item={editingItem}
        kind={kind}
      />
      <ConfirmDialog
        isOpen={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove?._id) removeMutation.mutate(pendingRemove._id);
          setPendingRemove(null);
        }}
        title={isPaid ? 'Remove paid backlink' : 'Remove backlink'}
        message={pendingRemove ? (
          isPaid
            ? `Remove the paid backlink "${pendingRemove.sourceUrl}"? This action cannot be undone.`
            : `Remove the row for "${pendingRemove.sourceUrl}"? It will return on the next API refresh unless the source no longer points at your site.`
        ) : ''}
        confirmText="Remove"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
