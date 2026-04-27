import api from './axiosInstance';

export const getBacklinksStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/backlinks/status`);
  return data.data;
};

export const refreshBacklinks = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/backlinks/refresh`);
  return data.data;
};

export const manualOverrideBacklinks = async (siteId, payload) => {
  const { data } = await api.patch(`/api/sites/${siteId}/backlinks/manual`, payload);
  return data.data;
};

export const getBacklinksChangelog = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/backlinks/changelog`);
  return data.data;
};

export const addBacklinkItem = async (siteId, payload) => {
  const { data } = await api.post(`/api/sites/${siteId}/backlinks/items`, payload);
  return data.data;
};

export const updateBacklinkItem = async (siteId, itemId, payload) => {
  const { data } = await api.patch(`/api/sites/${siteId}/backlinks/items/${itemId}`, payload);
  return data.data;
};

export const removeBacklinkItem = async (siteId, itemId) => {
  const { data } = await api.delete(`/api/sites/${siteId}/backlinks/items/${itemId}`);
  return data.data;
};
