import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { themeColor } from './colorThemes';

function formatCtr(ctr) {
  return `${(ctr * 100).toFixed(2)}%`;
}

function PositionInfo() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY - 8,
      left: rect.right + window.scrollX - 208,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, updatePos]);

  return (
    <span className="inline-flex items-center gap-1">
      Position
      <button
        ref={btnRef}
        type="button"
        onClick={() => { updatePos(); setOpen((v) => !v); }}
        onMouseEnter={() => { updatePos(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-brand-outline hover:text-amber-500 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="w-52 p-2.5 rounded-lg bg-brand-on-surface text-white text-[11px] font-normal leading-relaxed shadow-xl font-label"
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999, transform: 'translateY(-100%)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0"></span> Top 10 — Excellent ranking</div>
          <div className="flex items-center gap-1.5 mb-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block flex-shrink-0"></span> 11-20 — Needs improvement</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-surface-container-highest inline-block flex-shrink-0"></span> 20+ — Low visibility</div>
        </div>,
        document.body
      )}
    </span>
  );
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export default function TopPagesTable({ pages, themeKey }) {
  if (!pages || pages.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No page data available for this period.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Top Pages
      </h4>
      <div className="overflow-x-auto rounded-lg border border-brand-outline-variant dark:border-brand-outline">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-surface-container-low dark:bg-brand-on-surface/50">
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Page</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Clicks</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">Impressions</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">CTR</th>
              <th className="text-right py-2.5 px-3 font-medium text-brand-on-surface-variant dark:text-brand-outline text-xs uppercase tracking-wider font-label">
                <PositionInfo />
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 dark:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/30 transition-colors">
                <td className="py-2 px-3 text-brand-outline dark:text-brand-on-surface-variant tabular-nums">{i + 1}</td>
                <td className="py-2 px-3 max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeColor(themeKey, i % 4) }}
                    />
                    <span className="text-brand-on-surface dark:text-brand-outline-variant  text-xs truncate font-label" title={row.page}>
                      {shortenUrl(row.page)}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold" style={{ color: themeColor(themeKey, 0) }}>
                  {row.clicks.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {row.impressions.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                  {formatCtr(row.ctr)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  <span className={row.position <= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : row.position <= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-brand-on-surface-variant dark:text-brand-outline'}>
                    {row.position.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
