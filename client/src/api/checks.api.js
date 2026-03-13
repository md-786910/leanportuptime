import api from './axiosInstance';

export const fetchCheckHistory = async (siteId, params = {}) => {
  const { data } = await api.get(`/api/sites/${siteId}/checks`, { params });
  return { checks: data.data, meta: data.meta };
};

export const fetchCheckSummary = async (siteId, period = '24h') => {
  const { data } = await api.get(`/api/sites/${siteId}/checks/summary`, {
    params: { period },
  });
  return data.data;
};
