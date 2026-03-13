import api from './axiosInstance';

export const fetchSSL = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/ssl`);
  return data.data;
};

export const fetchSSLHistory = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/ssl/history`);
  return data.data;
};

export const triggerSSLCheck = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/ssl/check`);
  return data.data;
};
