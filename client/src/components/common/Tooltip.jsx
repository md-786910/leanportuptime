import { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const TOOLTIP_GAP = 6;

function computePosition(triggerRect, tooltipSize, placement) {
  const { width: tw, height: th } = tooltipSize;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = triggerRect.bottom + TOOLTIP_GAP;
      left = triggerRect.left + triggerRect.width / 2 - tw / 2;
      break;
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - th / 2;
      left = triggerRect.right + TOOLTIP_GAP;
      break;
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - th / 2;
      left = triggerRect.left - tw - TOOLTIP_GAP;
      break;
    case 'top':
    default:
      top = triggerRect.top - th - TOOLTIP_GAP;
      left = triggerRect.left + triggerRect.width / 2 - tw / 2;
      break;
  }

  // Clamp to viewport so the tooltip never disappears off-screen.
  const margin = 4;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left < margin) left = margin;
  if (left + tw > vw - margin) left = vw - margin - tw;
  if (top < margin) top = margin;
  if (top + th > vh - margin) top = vh - margin - th;

  return { top, left };
}

/**
 * Lightweight hover/focus tooltip rendered via portal so it escapes parent
 * overflow-hidden / overflow-x-auto containers (cards, table viewports).
 *
 * Props:
 *   content    – string (1-2 lines) to display. Falsy => render children alone.
 *   placement  – 'top' | 'bottom' | 'right' | 'left' (default 'top')
 *   children   – the element the tooltip is attached to
 *   className  – extra classes on the wrapper span
 */
export function Tooltip({ content, placement = 'top', children, className = '' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const id = useId();
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current || !tooltipRef.current) return undefined;
    const updatePosition = () => {
      const triggerRect = wrapRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setCoords(computePosition(triggerRect, tooltipRect, placement));
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, placement, content]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!content) return children ?? null;

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && createPortal(
        <span
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-[1000] max-w-[260px] whitespace-normal text-left rounded-md bg-brand-on-surface dark:bg-brand-surface-container-high text-white dark:text-brand-outline-variant text-[11px] leading-snug font-label px-2.5 py-1.5 shadow-lg"
          style={{ top: coords.top, left: coords.left, width: 'max-content' }}
        >
          {content}
        </span>,
        document.body,
      )}
    </span>
  );
}

const InfoIcon = ({ className = '' }) => (
  <svg
    className={`w-3 h-3 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Convenience wrapper: renders `label` followed by an info icon that reveals `tooltip` on hover/focus.
 */
export function LabelWithTooltip({
  label,
  tooltip,
  placement = 'top',
  className = '',
  iconClassName = '',
  as: As = 'span',
}) {
  if (!tooltip) return <As className={className}>{label}</As>;
  return (
    <As className={`inline-flex items-center gap-1 ${className}`}>
      <span>{label}</span>
      <Tooltip content={tooltip} placement={placement}>
        <button
          type="button"
          tabIndex={0}
          aria-label={`Info about ${label}`}
          className={`text-brand-outline hover:text-brand-on-surface-variant dark:hover:text-brand-outline-variant focus:outline-none focus:ring-1 focus:ring-brand-primary-container rounded-full ${iconClassName}`}
        >
          <InfoIcon />
        </button>
      </Tooltip>
    </As>
  );
}

export default Tooltip;
