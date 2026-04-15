import api from './axiosInstance';

export const fetchShareLinks = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/share-links`);
  return data.data;
};

export const createShareLink = async (siteId, linkData) => {
  const { data } = await api.post(`/api/sites/${siteId}/share-links`, linkData);
  return data.data;
};

export const updateShareLink = async (siteId, linkId, linkData) => {
  const { data } = await api.patch(`/api/sites/${siteId}/share-links/${linkId}`, linkData);
  return data.data;
};

export const revokeShareLink = async (siteId, linkId) => {
  const { data } = await api.delete(`/api/sites/${siteId}/share-links/${linkId}`);
  return data.data;
};

export const regenerateShareLink = async (siteId, linkId) => {
  const { data } = await api.post(`/api/sites/${siteId}/share-links/${linkId}/regenerate`);
  return data.data;
};
