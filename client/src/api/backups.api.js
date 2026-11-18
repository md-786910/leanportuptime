import api from './axiosInstance';

export const getBackups = async () => {
  const { data } = await api.get('/api/backups');
  return data.data;
};

export const createBackup = async () => {
  const { data } = await api.post('/api/backups');
  return data.data;
};
