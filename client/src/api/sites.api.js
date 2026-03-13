import api from './axiosInstance';

export const fetchSites = async (params = {}) => {
  const { data } = await api.get('/api/sites', { params });
  return { sites: data.data, meta: data.meta };
};

export const fetchSite = async (id) => {
  const { data } = await api.get(`/api/sites/${id}`);
  return data.data;
};

export const createSite = async (siteData) => {
  const { data } = await api.post('/api/sites', siteData);
  return data.data;
};

export const updateSite = async (id, siteData) => {
  const { data } = await api.patch(`/api/sites/${id}`, siteData);
  return data.data;
};

export const deleteSite = async (id) => {
  const { data } = await api.delete(`/api/sites/${id}`);
  return data.data;
};

export const triggerCheck = async (id) => {
  const { data } = await api.post(`/api/sites/${id}/check`);
  return data.data;
};

export const togglePause = async (id) => {
  const { data } = await api.post(`/api/sites/${id}/pause`);
  return data.data;
};
