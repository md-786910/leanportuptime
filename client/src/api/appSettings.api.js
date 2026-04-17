import api from './axiosInstance';

export const getAppSettings = async () => {
  const { data } = await api.get('/api/settings');
  return data.data;
};

export const updateAppSettings = async (payload) => {
  const { data } = await api.patch('/api/settings', payload);
  return data.data;
};
