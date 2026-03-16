import api from './axiosInstance';

export const fetchPlugins = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/plugins`);
  return data.data;
};

export const triggerPluginScan = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/plugins/scan`);
  return data.data;
};

export const fetchPluginHistory = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/plugins/history`);
  return data.data;
};
