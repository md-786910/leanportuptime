import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { resetPassword, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Minimum 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await resetPassword(token, password);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-on-surface dark:text-white mb-6">Set new password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput label="New Password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Min 8 characters" />
        <PasswordInput label="Confirm Password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} placeholder="Repeat password" />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Reset password
        </Button>
      </form>
    </div>
  );
}
