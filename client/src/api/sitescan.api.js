import api from './axiosInstance';

export const fetchSiteScan = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/sitescan`);
  return data.data;
};

export const triggerSiteScan = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/sitescan/scan`);
  return data.data;
};

export const fetchSiteScanHistory = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/sitescan/history`);
  return data.data;
};
