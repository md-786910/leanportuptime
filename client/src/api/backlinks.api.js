import api from './axiosInstance';

export const getBacklinksStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/backlinks/status`);
  return data.data;
};

export const refreshBacklinks = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/backlinks/refresh`);
  return data.data;
};
