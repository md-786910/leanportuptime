const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'ssl', label: 'SSL' },
  { key: 'seo', label: 'SEO (Lighthouse)' },
  { key: 'seo-report', label: 'SEO Report' },
  { key: 'security', label: 'Security' },
  { key: 'plugins', label: 'Plugins' },
  { key: 'sitescan', label: 'Site Scan' },
  { key: 'history', label: 'History' },
];

export default function SiteDetailTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-brand-outline-variant dark:border-brand-outline">
      <nav className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map((tab) => (
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
