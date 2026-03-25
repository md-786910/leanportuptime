import api from './axiosInstance';

export const fetchSeoAudit = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/seo`);
  return data.data;
};

export const triggerSeoScan = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/seo/scan`);
  return data.data;
};

export const fetchSeoHistory = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/seo/history`);
  return data.data;
};

export const fetchPageSpeed = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/seo/pagespeed`);
  return data.data;
};
