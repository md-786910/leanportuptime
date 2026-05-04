import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { rangeLabel } from './useComparePeriods';

/**
 * Compact, header-friendly range picker.
 *
 * Renders the formatted range as a small clickable pill with a calendar icon.
 * Clicking opens an inline calendar (with year/month dropdowns) in a popover
 * portaled to <body> so it escapes any `overflow-x-auto` ancestor.
 *
 * `align`:
 *   - 'left'  → popover anchors to the trigger's left edge (expands rightward)
 *   - 'right' → popover anchors to the trigger's right edge (expands leftward)
 */
export default function RangeHeaderButton({
  value,
  onChange,
  align = 'right',
  fallback = '—',
  editable = true,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, right: 'auto' });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 6 + window.scrollY;
    if (align === 'right') {
      const right = window.innerWidth - rect.right - window.scrollX;
      setPos({ top, right, left: 'auto' });
    } else {
      const left = rect.left + window.scrollX;
      setPos({ top, left, right: 'auto' });
    }
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const handleMouse = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleMouse);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const [start, end] = value || [null, null];
  const label = start && end ? rangeLabel(start, end) : fallback;

  if (!editable) {
    return <span className="font-label">{label}</span>;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md border font-label transition-colors ${
          open
            ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
            : 'border-brand-outline-variant dark:border-brand-outline text-brand-on-surface dark:text-brand-outline-variant hover:border-brand-primary hover:text-brand-primary'
        }`}
      >
        <span className="whitespace-nowrap">{label}</span>
        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, right: pos.right }}
          className="z-50 daterangepicker-inline"
        >
          <DatePicker
            selectsRange
            startDate={start}
            endDate={end}
            onChange={(dates) => {
              onChange(dates);
              if (dates[0] && dates[1]) setOpen(false);
            }}
            monthsShown={1}
            maxDate={new Date()}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            inline
          />
        </div>,
        document.body,
      )}
    </>
  );
}
