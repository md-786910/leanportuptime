import SiteCard from './SiteCard';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

export default function SiteGrid({ sites, isLoading, onAddSite }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sites.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        }
        title="No sites yet"
        description="Add your first WordPress site to start monitoring."
        action={<Button onClick={onAddSite}>Add Site</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sites.map((site) => (
        <SiteCard key={site._id} site={site} />
      ))}
    </div>
  );
}
