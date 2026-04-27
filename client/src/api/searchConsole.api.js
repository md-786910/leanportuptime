import api from './axiosInstance';

// Google OAuth
export const getGoogleAuthUrl = async () => {
  const { data } = await api.get('/api/google/connect');
  return data.data;
};

export const disconnectGoogle = async () => {
  const { data } = await api.post('/api/google/disconnect');
  return data.data;
};

export const getGoogleStatus = async () => {
  const { data } = await api.get('/api/google/status');
  return data.data;
};

// Search Console per site
export const getGscStatus = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/search-console/status`);
  return data.data;
};

export const listGscProperties = async (siteId) => {
  const { data } = await api.get(`/api/sites/${siteId}/search-console/properties`);
  return data.data;
};

export const linkGscProperty = async (siteId, property) => {
  const { data } = await api.post(`/api/sites/${siteId}/search-console/link`, { property });
  return data.data;
};

export const unlinkGscProperty = async (siteId) => {
  const { data } = await api.post(`/api/sites/${siteId}/search-console/unlink`);
  return data.data;
};

export const getGscPerformance = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/search-console/performance`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};

export const getGscInsights = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/search-console/insights`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};
