const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'ssl', label: 'SSL' },
  { key: 'security', label: 'Security' },
  { key: 'history', label: 'History' },
];

export default function SiteDetailTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
