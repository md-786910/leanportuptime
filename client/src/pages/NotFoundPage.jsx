import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface-container-low dark:bg-brand-on-surface px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-primary mb-4 font-headline">404</p>
        <h1 className="text-2xl font-semibold text-brand-on-surface dark:text-white mb-2">Page not found</h1>
        <p className="text-brand-on-surface-variant dark:text-brand-outline mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
