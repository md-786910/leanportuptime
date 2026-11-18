import api from './axiosInstance';

export const getLinkedInMetrics = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/linkedin/metrics`, {
    params: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period },
  });
  return data.data;
};
