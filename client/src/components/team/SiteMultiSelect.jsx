import { useSites } from '../../hooks/useSites';

export default function SiteMultiSelect({ selected = [], onChange }) {
  const { sites, isLoading } = useSites({ limit: 100 });

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading sites...</p>;
  }

  if (sites.length === 0) {
    return <p className="text-sm text-gray-500">No sites available</p>;
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
      {sites.map((site) => (
        <label
          key={site._id}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(site._id)}
            onChange={() => toggle(site._id)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
              {site.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{site.url}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
