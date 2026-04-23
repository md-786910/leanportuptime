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
    return <p className="text-sm text-brand-on-surface-variant">Loading sites...</p>;
  }

  if (sites.length === 0) {
    return <p className="text-sm text-brand-on-surface-variant">No sites available</p>;
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto border border-brand-outline-variant dark:border-brand-outline rounded-lg p-2">
      {sites.map((site) => (
        <label
          key={site._id}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(site._id)}
            onChange={() => toggle(site._id)}
            className="rounded border-brand-outline-variant text-brand-primary focus:ring-brand-primary-container"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium font-label text-brand-on-surface dark:text-brand-outline-variant truncate block">
              {site.name}
            </span>
            <span className="text-xs text-brand-on-surface-variant dark:text-brand-outline truncate block font-label">{site.url}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
