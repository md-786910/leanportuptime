import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.email, form.password, form.name);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" id="name" value={form.name} onChange={update('name')} error={errors.name} placeholder="John Doe" />
        <Input label="Email" id="email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" id="password" type="password" value={form.password} onChange={update('password')} error={errors.password} placeholder="Min 8 characters" />
        <Input label="Confirm Password" id="confirmPassword" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} placeholder="Repeat password" />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
