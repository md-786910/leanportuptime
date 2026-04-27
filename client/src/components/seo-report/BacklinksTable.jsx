import { useMemo, useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { useIsAdmin } from '../../hooks/useRole';
import { useRemoveBacklinkItem } from '../../hooks/useBacklinks';
import AddBacklinkItemModal from './AddBacklinkItemModal';
import EditBacklinkItemModal from './EditBacklinkItemModal';

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

export default function BacklinksTable({ items = [], listFetchedAt, listFetchError, siteId }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  const isAdmin = useIsAdmin();
  const removeMutation = useRemoveBacklinkItem(siteId);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  if (items.length === 0 && !listFetchError) {
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline uppercase tracking-wider font-label">Backlinks</h4>
            <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline tabular-nums px-1.5 py-0.5 rounded bg-brand-surface-container-high dark:bg-brand-on-surface">
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
              Add backlink
            </button>
          )}
        </div>
        <div className="p-4 rounded-lg border border-dashed border-brand-outline-variant dark:border-brand-outline text-center">
          <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">No individual backlinks recorded yet.</p>
          <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant mt-1 font-label">Click Refresh to fetch the link list, or add one manually.</p>
        </div>
        <AddBacklinkItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} siteId={siteId} />
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline uppercase tracking-wider font-label">Backlinks</h4>
          <span className="text-[10px] font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline tabular-nums px-1.5 py-0.5 rounded bg-brand-surface-container-high dark:bg-brand-on-surface">
            {items.length}
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
            Add backlink
          </button>
        )}
      </div>

      {listFetchError && (
        <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-label">
            Backlink list couldn&apos;t be refreshed — showing last known data. ({listFetchError})
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-brand-outline-variant dark:border-brand-outline">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider w-8 font-label">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Source</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider hidden md:table-cell font-label">Anchor</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider hidden lg:table-cell font-label">Target</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Type</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider hidden sm:table-cell font-label">First Seen</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Last Seen</th>
              {isAdmin && (
                <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider w-20 font-label" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const index = (safePage - 1) * pageSize + i + 1;
              return (
                <tr key={r._id || `${r.sourceUrl}-${i}`} className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/30 transition-colors">
                  <td className="py-2 px-3 text-brand-outline dark:text-brand-on-surface-variant tabular-nums">{index}</td>
                  <td className="py-2 px-3 max-w-[280px]">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-xs text-brand-primary dark:text-brand-400 hover:underline truncate font-label"
                      title={r.sourceUrl}
                    >
                      <span className="truncate">{hostOf(r.sourceUrl)}</span>
                      <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {r.domainFromRank > 0 && (
                      <div className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant mt-0.5 font-label">
                        DR {r.domainFromRank}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 max-w-[220px] hidden md:table-cell">
                    <span className="text-xs text-brand-on-surface dark:text-brand-outline truncate block font-label" title={r.anchor}>
                      {r.anchor || <span className="text-brand-outline dark:text-brand-on-surface-variant italic">— no anchor —</span>}
                    </span>
                  </td>
                  <td className="py-2 px-3 max-w-[180px] hidden lg:table-cell">
                    <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline truncate block font-label" title={r.targetUrl}>
                      {pathOf(r.targetUrl)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TypeBadge type={r.linkType} />
                      <FollowBadge doFollow={r.doFollow} />
                      {r.source === 'manual' && <ManualBadge />}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-brand-on-surface-variant dark:text-brand-outline hidden sm:table-cell tabular-nums font-label">
                    {timeAgo(r.firstSeen)}
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-label">
                    {timeAgo(r.lastSeen)}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingItem(r)}
                          title="Edit backlink"
                          className="text-brand-outline hover:text-brand-primary transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingRemove(r)}
                          title="Remove backlink"
                          className="text-brand-outline hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2 text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs rounded border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant focus:ring-1 focus:ring-brand-primary-container focus:border-brand-500 font-label"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-label">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2 py-1 text-xs rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-label"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2 py-1 text-xs rounded border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-label"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {listFetchedAt && (
        <p className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant mt-2 text-center font-label">
          Links last updated {timeAgo(listFetchedAt)} · up to 100 links tracked per refresh
        </p>
      )}

      <AddBacklinkItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} siteId={siteId} />
      <EditBacklinkItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        siteId={siteId}
        item={editingItem}
      />
      <ConfirmDialog
        isOpen={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove?._id) removeMutation.mutate(pendingRemove._id);
          setPendingRemove(null);
        }}
        title="Remove backlink"
        message={pendingRemove ? `Remove the row for "${pendingRemove.sourceUrl}"? It will return on the next API refresh unless the source no longer points at your site.` : ''}
        confirmText="Remove"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
