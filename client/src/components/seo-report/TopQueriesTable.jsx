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
      POS
      <button
        ref={btnRef}
        type="button"
        onClick={() => { updatePos(); setOpen((v) => !v); }}
        onMouseEnter={() => { updatePos(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-brand-outline hover:text-amber-500 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="w-52 p-3 rounded-xl bg-brand-on-surface text-white text-[11px] font-bold leading-tight shadow-2xl font-label z-[9999]"
          style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
        >
          <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0"></span> TOP 10 — EXCELLENT</div>
          <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block flex-shrink-0"></span> 11-20 — NEEDS WORK</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-outline inline-block flex-shrink-0"></span> 20+ — LOW VISIBILITY</div>
        </div>,
        document.body
      )}
    </span>
  );
}

export default function TopQueriesTable({ queries, themeKey }) {
  if (!queries || queries.length === 0) {
    return (
      <p className="text-xs font-black uppercase tracking-widest text-brand-outline text-center py-8">
        No query data available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-brand-surface-container-low border-b-0">
          <tr>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant w-8">#</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant">Query</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">Clicks</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">IMPR</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">CTR</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-on-surface-variant text-right">
              <PositionInfo />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-surface-container">
          {queries.map((row, i) => (
            <tr key={i} className="hover:bg-brand-surface-container-low/50 transition-colors group">
              <td className="px-6 py-4 text-[11px] font-bold text-brand-outline tabular-nums">{i + 1}</td>
              <td className="px-6 py-4 max-w-[200px] truncate">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: themeColor(themeKey, i % 4) }}
                  />
                  <span className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant truncate font-label">
                    {row.query}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right tabular-nums text-sm font-black" style={{ color: themeColor(themeKey, 0) }}>
                {row.clicks.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right text-brand-on-surface-variant/80 dark:text-brand-outline tabular-nums text-[11px] font-bold">
                {row.impressions.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right text-brand-on-surface-variant/80 dark:text-brand-outline tabular-nums text-[11px] font-bold">
                {formatCtr(row.ctr)}
              </td>
              <td className="px-6 py-4 text-right tabular-nums text-[11px] font-black">
                <span className={row.position <= 10 ? 'text-green-600 dark:text-green-400' : row.position <= 20 ? 'text-[#a44100] dark:text-[#a44100]' : 'text-brand-outline'}>
                  {row.position.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}