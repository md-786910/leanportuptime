import api from './axiosInstance';

export const getAnalyticsStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/status`);
  return data.data;
};

export const listAnalyticsProperties = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/properties`);
  return data.data;
};

export const linkAnalyticsProperty = async (siteId, propertyId, propertyName) => {
  const { data } = await api.post(`/api/sites/${siteId}/analytics/link`, { propertyId, propertyName });
  return data.data;
};

export const unlinkAnalyticsProperty = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/analytics/unlink`);
  return data.data;
};

export const getAnalyticsOverview = async (siteId, period = '28d') => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/overview`, {
    params: { period },
  });
  return data.data;
};

export const getAnalyticsInsights = async (siteId, period = '28d') => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/insights`, {
    params: { period },
  });
  return data.data;
};

export const getWebsiteAnalytics = async (siteId, period = '28d') => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/website`, {
    params: { period },
  });
  return data.data;
};
