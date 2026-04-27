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

export const getAnalyticsOverview = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/overview`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};

export const getAnalyticsInsights = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/insights`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};

export const getWebsiteAnalytics = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/website`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};

export const getAnalyticsCountries = async (siteId, dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/analytics/countries`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : {},
  });
  return data.data;
};

export const updateAnalyticsFilters = async (siteId, filters) => {
  const { data } = await api.patch(`/api/sites/${siteId}/analytics/filters`, filters);
  return data.data;
};
