import api from './axiosInstance';

export const fetchSecurity = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/security`);
  return data.data;
};

export const triggerSecurityScan = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/security/scan`);
  return data.data;
};
