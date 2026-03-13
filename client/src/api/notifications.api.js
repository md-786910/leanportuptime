import api from './axiosInstance';

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/api/notifications', { params });
  return { notifications: data.data, meta: data.meta };
};
