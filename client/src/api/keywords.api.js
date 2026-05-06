import api from './axiosInstance';

export const getKeywordsStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/keywords/status`);
  return data.data;
};

export const addKeyword = async (siteId, payload) => {
  // payload may be a string (legacy) or { keyword, locationCode, languageCode }
  const body = typeof payload === 'string' ? { keyword: payload } : payload;
  const { data } = await api.post(`/api/sites/${siteId}/keywords`, body);
  return data.data;
};

export const addKeywordsBulk = async (siteId, payload) => {
  // payload may be a plain string array (legacy) or { keywords, locations }
  const body = Array.isArray(payload) ? { keywords: payload } : payload;
  const { data } = await api.post(`/api/sites/${siteId}/keywords/bulk`, body);
  return data.data;
};

export const removeKeyword = async (siteId, keyword, locationCode = null) => {
  const url = `/api/sites/${siteId}/keywords/${encodeURIComponent(keyword)}`;
  const { data } = await api.delete(url, locationCode != null ? { params: { locationCode } } : undefined);
  return data.data;
};

export const refreshKeywords = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/keywords/refresh`);
  return data.data;
};

export const manualOverrideKeyword = async (siteId, keyword, payload, locationCode = null) => {
  const url = `/api/sites/${siteId}/keywords/${encodeURIComponent(keyword)}`;
  const config = locationCode != null ? { params: { locationCode } } : undefined;
  const { data } = await api.patch(url, payload, config);
  return data.data;
};

export const moveAllKeywordsToCountry = async (siteId, { locationCode, languageCode }) => {
  const { data } = await api.patch(`/api/sites/${siteId}/keywords/move-all`, { locationCode, languageCode });
  return data.data;
};
