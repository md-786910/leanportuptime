export const THEMES = {
  default: {
    name: 'Default',
    preview: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'],
    colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  },
  ocean: {
    name: 'Ocean',
    preview: ['#0ea5e9', '#06b6d4', '#0284c7', '#14b8a6'],
    colors: ['#0ea5e9', '#06b6d4', '#0284c7', '#14b8a6', '#0369a1', '#0d9488'],
  },
  sunset: {
    name: 'Sunset',
    preview: ['#f97316', '#ef4444', '#ec4899', '#f59e0b'],
    colors: ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#dc2626', '#db2777'],
  },
  forest: {
    name: 'Forest',
    preview: ['#22c55e', '#10b981', '#059669', '#84cc16'],
    colors: ['#22c55e', '#10b981', '#059669', '#84cc16', '#16a34a', '#65a30d'],
  },
  corporate: {
    name: 'Corporate',
    preview: ['#6366f1', '#8b5cf6', '#a855f7', '#4f46e5'],
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#4f46e5', '#7c3aed', '#c084fc'],
  },
  monochrome: {
    name: 'Mono',
    preview: ['#374151', '#6b7280', '#9ca3af', '#d1d5db'],
    colors: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#e5e7eb'],
  },
};

/** Get a color from the theme by index (wraps around). */
export function themeColor(themeKey, index) {
  const theme = THEMES[themeKey] || THEMES.default;
  return theme.colors[index % theme.colors.length];
}

/** Score-based gauge color. Default theme uses threshold coloring; others use palette. */
export function gaugeColor(score, themeKey, index = 0) {
  if (themeKey === 'default') {
    if (score >= 90) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
  return themeColor(themeKey, index);
}

/** Metric bar color. Default theme uses threshold coloring; others use palette. */
export function metricBarColor(value, good, poor, themeKey, index = 0) {
  if (themeKey === 'default') {
    if (value <= good) return '#10b981';
    if (value <= poor) return '#f59e0b';
    return '#ef4444';
  }
  return themeColor(themeKey, index);
}
