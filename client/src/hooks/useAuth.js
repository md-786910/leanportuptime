import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { loginApi, registerApi, logoutApi, forgotPasswordApi, resetPasswordApi } from '../api/auth.api';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { user, accessToken } = await loginApi(email, password);
      setAuth(user, accessToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setIsLoading(true);
    try {
      const { user, accessToken } = await registerApi(email, password, name);
      setAuth(user, accessToken);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Logout even if API call fails
    }
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  const forgotPassword = async (email) => {
    setIsLoading(true);
    try {
      await forgotPasswordApi(email);
      toast.success('If that email exists, a reset link was sent');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    setIsLoading(true);
    try {
      await resetPasswordApi(token, password);
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Reset failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isAuthenticated, isLoading, login, register, logout, forgotPassword, resetPassword };
};
