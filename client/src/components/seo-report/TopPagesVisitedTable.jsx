import { useState, useRef, useEffect } from 'react';
import { themeColor } from './colorThemes';
import Spinner from '../common/Spinner';
import ComparePagesModal from './ComparePagesModal';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function PagesFilterDropdown({ visiblePages, excludedPages, onExclude, onRestore, onClearAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  // Show currently visible pages + excluded pages, no duplicates
  const visiblePaths = visiblePages.map((p) => p.page);
  const allPaths = [...visiblePaths, ...excludedPages.filter((p) => !visiblePaths.includes(p))];

  const toggle = (path) => {
    if (excludedPages.includes(path)) onRestore(path);
    else onExclude(path);
  };

  const tooltip = excludedPages.length === 0
    ? 'Filter pages'
    : excludedPages.length === 1
      ? 'Excluding 1 page'
      : `Excluding ${excludedPages.length} pages`;

  const active = excludedPages.length > 0;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={tooltip}
        aria-label={tooltip}
        className={`relative w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${
          active
            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
            : 'border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-outline hover:border-brand-400'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {active && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold font-label flex items-center justify-center leading-none">
            {excludedPages.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 max-h-80 overflow-y-auto z-30 rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-brand-outline-variant dark:border-brand-outline">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-outline font-label">Exclude pages</span>
            {excludedPages.length > 0 && (
              <button type="button" onClick={onClearAll} className="text-[11px] text-brand-primary hover:underline font-label">
                Clear all
              </button>
            )}
          </div>
          {allPaths.length === 0 ? (
            <div className="px-3 py-4 text-xs text-brand-outline font-label">No pages available.</div>
          ) : (
            <ul className="py-1">
              {allPaths.map((path) => {
                const checked = excludedPages.includes(path);
                return (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => toggle(path)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50 transition-colors font-label"
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-brand-primary border-brand-primary' : 'border-brand-outline'}`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`flex-1 truncate ${checked ? 'text-brand-outline line-through' : 'text-brand-on-surface dark:text-brand-outline-variant'}`}
                        title={path}
                      >
                        {path}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopPagesVisitedTable({
  pages,
  themeKey,
  excludedPages = [],
  onExclude,
  onRestore,
  isRefreshing = false,
  siteId,
}) {
  const canExclude = typeof onExclude === 'function' && typeof onRestore === 'function';
  const [compareOpen, setCompareOpen] = useState(false);
  const canCompare = !!siteId && Array.isArray(pages) && pages.length > 0;

  const Overlay = () => (
    isRefreshing ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-brand-on-surface/60 backdrop-blur-[1px] rounded-lg z-10 transition-opacity">
        <Spinner size="sm" />
      </div>
    ) : null
  );

  const Header = () => (
    <div className="flex items-start justify-between gap-3 mb-3">
      {/* Top Pages Visited */}
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Top Pages Visited
      </h4>
      <div className="flex items-center gap-2">
        {canCompare && (
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
            title="Compare against a past period"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare
          </button>
        )}
        {canExclude && (
          <PagesFilterDropdown
            visiblePages={pages || []}
            excludedPages={excludedPages}
            onExclude={onExclude}
            onRestore={onRestore}
            onClearAll={() => excludedPages.forEach((p) => onRestore(p))}
          />
        )}
      </div>
    </div>
  );

  if (!pages || pages.length === 0) {
    return (
      <div className="relative">
        <Header />
        <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
          {excludedPages.length > 0 ? 'All top pages are excluded.' : 'No page view data available.'}
        </p>
        <Overlay />
        {siteId && (
          <ComparePagesModal
            isOpen={compareOpen}
            onClose={() => setCompareOpen(false)}
            siteId={siteId}
            currentPages={pages || []}
            currentLabel="Current Period"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Header />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-brand-surface-container-low border-b-0">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-8">#</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Page</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Page Views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-surface-container">
            {pages.map((row, i) => (
              <tr key={i} className="hover:bg-brand-surface-container-low/50 transition-colors">
                <td className="px-6 py-4 text-[11px] font-bold text-brand-outline tabular-nums">{i + 1}</td>
                <td className="px-6 py-4 max-w-[350px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeColor(themeKey, i % 4) }}
                    />
                    <span className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant truncate font-label" title={row.page}>
                      {row.page}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-sm font-black" style={{ color: themeColor(themeKey, 0) }}>
                  {formatNumber(row.pageViews)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Overlay />

      {siteId && (
        <ComparePagesModal
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          siteId={siteId}
          currentPages={pages}
          currentLabel="Current Period"
        />
      )}
    </div>
  );
}
