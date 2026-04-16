import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to={from} replace />;

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(email, password);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in to your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <PasswordInput
          label="Password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Min 8 characters"
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign in
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
