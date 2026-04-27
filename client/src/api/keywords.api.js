import api from './axiosInstance';

export const getKeywordsStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/keywords/status`);
  return data.data;
};

export const addKeyword = async (siteId, keyword) => {
  const { data } = await api.post(`/api/sites/${siteId}/keywords`, { keyword });
  return data.data;
};

export const addKeywordsBulk = async (siteId, keywords) => {
  const { data } = await api.post(`/api/sites/${siteId}/keywords/bulk`, { keywords });
  return data.data;
};

export const removeKeyword = async (siteId, keyword) => {
  const { data } = await api.delete(`/api/sites/${siteId}/keywords/${encodeURIComponent(keyword)}`);
  return data.data;
};

export const refreshKeywords = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/keywords/refresh`);
  return data.data;
};

export const manualOverrideKeyword = async (siteId, keyword, payload) => {
  const { data } = await api.patch(`/api/sites/${siteId}/keywords/${encodeURIComponent(keyword)}`, payload);
  return data.data;
};
