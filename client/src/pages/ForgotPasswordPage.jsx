import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    await forgotPassword(email);
    setSent(true);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Forgot password</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Enter your email and we'll send you a reset link.
      </p>
      {sent ? (
        <div className="text-center">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
            If that email exists, a password reset link was sent. Check your inbox.
          </p>
          <Link to="/login" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Send reset link
          </Button>
          <p className="text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
