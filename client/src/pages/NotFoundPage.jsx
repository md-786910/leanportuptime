import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-600 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
