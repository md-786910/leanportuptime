import { useState } from 'react';
import { useSites } from '../../hooks/useSites';
import { SITE_TABS } from '../../constants/tabs';

const ALL_TAB_KEYS = SITE_TABS.map((t) => t.key);

// `siteTabs` semantic: missing entry => all tabs allowed. We only emit a key
// when the admin has narrowed access by un-checking at least one tab.
function compactSiteTabs(siteId, tabs) {
  if (!tabs || tabs.length === ALL_TAB_KEYS.length) return undefined;
  return tabs;
}

export default function SiteTabAccessSelect({ selectedSites = [], siteTabs = {}, onSitesChange, onTabsChange }) {
  const { sites, isLoading } = useSites({ limit: 100 });
  const [expanded, setExpanded] = useState(() => new Set());

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tabsFor = (siteId) => siteTabs[siteId] ?? ALL_TAB_KEYS;

  const setTabsFor = (siteId, tabs) => {
    const next = { ...siteTabs };
    const compact = compactSiteTabs(siteId, tabs);
    if (compact === undefined) {
      delete next[siteId];
    } else {
      next[siteId] = compact;
    }
    onTabsChange?.(next);
  };

  const toggleSite = (siteId) => {
    if (selectedSites.includes(siteId)) {
      onSitesChange?.(selectedSites.filter((s) => s !== siteId));
      // Drop tab restriction when project is unchecked
      if (siteTabs[siteId]) {
        const next = { ...siteTabs };
        delete next[siteId];
        onTabsChange?.(next);
      }
    } else {
      onSitesChange?.([...selectedSites, siteId]);
    }
  };

  const toggleTab = (siteId, tabKey) => {
    const current = tabsFor(siteId);
    const nextTabs = current.includes(tabKey)
      ? current.filter((t) => t !== tabKey)
      : [...current, tabKey];
    setTabsFor(siteId, nextTabs);
  };

  if (isLoading) {
    return <p className="text-sm text-brand-on-surface-variant">Loading sites...</p>;
  }

  if (sites.length === 0) {
    return <p className="text-sm text-brand-on-surface-variant">No sites available</p>;
  }

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto border border-brand-outline-variant dark:border-brand-outline rounded-lg p-2">
      {sites.map((site) => {
        const isSelected = selectedSites.includes(site._id);
        const isExpanded = expanded.has(site._id);
        const tabs = tabsFor(site._id);
        const isPartial = isSelected && tabs.length < ALL_TAB_KEYS.length;
        return (
          <div key={site._id} className="rounded">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSite(site._id)}
                className="rounded border-brand-outline-variant text-brand-primary focus:ring-brand-primary-container"
              />
              <button
                type="button"
                onClick={() => isSelected && toggleExpanded(site._id)}
                className="flex-1 text-left min-w-0 cursor-pointer disabled:cursor-default"
                disabled={!isSelected}
              >
                <span className="text-sm font-medium font-label text-brand-on-surface dark:text-brand-outline-variant truncate block">
                  {site.name}
                </span>
                <span className="text-xs text-brand-on-surface-variant dark:text-brand-outline truncate block font-label">
                  {site.url}
                </span>
              </button>
              {isSelected && (
                <span className="text-[10px] font-bold font-label uppercase tracking-wider text-brand-outline dark:text-brand-on-surface-variant">
                  {isPartial ? `${tabs.length}/${ALL_TAB_KEYS.length} tabs` : 'All tabs'}
                </span>
              )}
              {isSelected && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(site._id)}
                  className="p-1 text-brand-outline hover:text-brand-on-surface-variant"
                  aria-label={isExpanded ? 'Collapse tabs' : 'Expand tabs'}
                >
                  <svg className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {isSelected && isExpanded && (
              <div className="ml-7 mt-1 mb-2 grid grid-cols-2 gap-1 px-2 pb-2 border-l border-brand-outline-variant dark:border-brand-outline">
                {SITE_TABS.map((tab) => (
                  <label key={tab.key} className="flex items-center gap-2 text-xs text-brand-on-surface dark:text-brand-outline-variant cursor-pointer py-0.5 font-label">
                    <input
                      type="checkbox"
                      checked={tabs.includes(tab.key)}
                      onChange={() => toggleTab(site._id, tab.key)}
                      className="rounded border-brand-outline-variant text-brand-primary focus:ring-brand-primary-container h-3.5 w-3.5"
                    />
                    <span className="truncate">{tab.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
