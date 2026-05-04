import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const PRESETS = [
  { key: '1m',  label: 'Last 1 mo',  months: 1 },
  { key: '3m',  label: 'Last 3 mo',  months: 3 },
  { key: '6m',  label: 'Last 6 mo',  months: 6 },
  { key: '12m', label: 'Last 12 mo', months: 12 },
  { key: 'custom', label: 'Custom' },
];

export function rangeLabel(start, end) {
  if (!start || !end) return '';
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) return format(start, 'MMM yyyy');
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`
    : `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
}

function toApiRange(start, end) {
  if (!start || !end) return null;
  return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
}

/**
 * Shared state for compare modals' period selector.
 *
 * Returns:
 *   presetKey, setPresetKey
 *   isCustom: boolean
 *   customCurrentRange / customCompareRange: [Date|null, Date|null] tuples
 *   setCustomCurrentRange / setCustomCompareRange
 *   compareRange: { start, end }       — always populated (preset or custom)
 *   currentRange: { start, end }       — only populated in custom mode
 *   compareDateRange: { from, to }     — yyyy-MM-dd strings for API
 *   currentDateRange: { from, to } | null  — only set in custom mode
 *   compareLabelText: string           — formatted label of the compare range
 *   currentLabelText: string | null    — formatted label of the custom current range
 */
export function useComparePeriods({ isOpen }) {
  const [presetKey, setPresetKey] = useState('1m');
  const [customCurrentRange, setCustomCurrentRange] = useState(() => {
    const lastMonth = subMonths(new Date(), 1);
    return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
  });
  const [customCompareRange, setCustomCompareRange] = useState(() => {
    const monthBefore = subMonths(new Date(), 2);
    return [startOfMonth(monthBefore), endOfMonth(monthBefore)];
  });

  useEffect(() => {
    if (!isOpen) return;
    setPresetKey('1m');
    const lastMonth = subMonths(new Date(), 1);
    const monthBefore = subMonths(new Date(), 2);
    setCustomCurrentRange([startOfMonth(lastMonth), endOfMonth(lastMonth)]);
    setCustomCompareRange([startOfMonth(monthBefore), endOfMonth(monthBefore)]);
  }, [isOpen]);

  const isCustom = presetKey === 'custom';

  const [compareStart, compareEnd] = useMemo(() => {
    if (isCustom) return customCompareRange;
    const preset = PRESETS.find((p) => p.key === presetKey);
    const months = preset?.months || 1;
    const end = endOfMonth(subMonths(new Date(), 1));
    const start = startOfMonth(subMonths(new Date(), months));
    return [start, end];
  }, [isCustom, presetKey, customCompareRange]);

  const [currentStart, currentEnd] = isCustom ? customCurrentRange : [null, null];

  const compareDateRange = useMemo(() => toApiRange(compareStart, compareEnd), [compareStart, compareEnd]);
  const currentDateRange = useMemo(
    () => (isCustom ? toApiRange(currentStart, currentEnd) : null),
    [isCustom, currentStart, currentEnd],
  );

  const compareLabelText = useMemo(() => rangeLabel(compareStart, compareEnd), [compareStart, compareEnd]);
  const currentLabelText = useMemo(
    () => (isCustom ? rangeLabel(currentStart, currentEnd) : null),
    [isCustom, currentStart, currentEnd],
  );

  return {
    presetKey,
    setPresetKey,
    isCustom,
    customCurrentRange,
    setCustomCurrentRange,
    customCompareRange,
    setCustomCompareRange,
    currentRange: { start: currentStart, end: currentEnd },
    compareRange: { start: compareStart, end: compareEnd },
    compareDateRange,
    currentDateRange,
    compareLabelText,
    currentLabelText,
  };
}
