import SiteCard from './SiteCard';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

export default function SiteGrid({ sites, isLoading, onAddSite }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-brand-outline dark:text-brand-on-surface-variant">Loading sites...</p>
        </div>
      </div>
    );
  }

  if (!sites.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        }
        title="No sites found"
        description="Start monitoring your WordPress sites to track uptime, performance metrics, and security alerts in real-time."
        action={<Button onClick={onAddSite} size="lg">Add Your First Site</Button>}
      />
    );
  }

  const sorted = [...sites].sort(
    (a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {sorted.map((site) => (
        <SiteCard key={site._id} site={site} />
      ))}
    </div>
  );
}
