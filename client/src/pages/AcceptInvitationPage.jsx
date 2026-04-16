import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../components/common/PasswordInput';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { acceptInvitation } from '../api/invitations.api';
import { useAuthStore } from '../store/authStore';

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setApiError('');
    try {
      const { user, accessToken } = await acceptInvitation({
        token,
        name: form.name,
        password: form.password,
      });
      setAuth(user, accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">WP</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Sentinel</span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Accept Invitation</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Set up your account to start monitoring
        </p>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            <Link to="/login" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-1 inline-block">
              Go to login
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            id="name"
            value={form.name}
            onChange={update('name')}
            error={errors.name}
            placeholder="John Doe"
          />
          <PasswordInput
            label="Password"
            id="password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            placeholder="Min 8 characters"
          />
          <PasswordInput
            label="Confirm Password"
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="Repeat password"
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Accept & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
