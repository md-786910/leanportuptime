import api from './axiosInstance';

export const loginApi = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data.data;
};

export const registerApi = async (email, password, name) => {
  const { data } = await api.post('/api/auth/register', { email, password, name });
  return data.data;
};

export const logoutApi = async () => {
  const { data } = await api.post('/api/auth/logout');
  return data.data;
};

export const refreshApi = async () => {
  const { data } = await api.post('/api/auth/refresh');
  return data.data;
};

export const forgotPasswordApi = async (email) => {
  const { data } = await api.post('/api/auth/forgot-password', { email });
  return data.data;
};

export const resetPasswordApi = async (token, password) => {
  const { data } = await api.post('/api/auth/reset-password', { token, password });
  return data.data;
};
