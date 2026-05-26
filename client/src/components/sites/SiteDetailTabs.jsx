import { SITE_TABS } from '../../constants/tabs';

export default function SiteDetailTabs({ activeTab, onTabChange, allowedTabs }) {
  const visible = allowedTabs
    ? SITE_TABS.filter((t) => allowedTabs.includes(t.key))
    : SITE_TABS;
  return (
    <div className="border-b border-brand-outline-variant dark:border-brand-outline overflow-x-hidden">
      <nav className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
        {visible.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${ activeTab === tab.key ? 'border-brand-600 text-brand-primary dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-brand-on-surface-variant hover:text-brand-on-surface dark:text-brand-outline dark:hover:text-brand-outline' }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
