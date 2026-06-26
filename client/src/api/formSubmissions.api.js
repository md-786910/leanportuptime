import api from './axiosInstance';

// Period vs custom date range mirrors analytics.api.js: custom ranges send
// startDate/endDate, otherwise a `period` key.
const rangeParams = (period, dateRange) =>
  dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : { period };

// KPI feed — server defaults submitFrom to 'live' (demo excluded).
export const getFormSubmissionsCount = async (siteId, period = '28d', dateRange = null) => {
  const { data } = await api.get(`/api/sites/${siteId}/form-submissions/count`, {
    params: rangeParams(period, dateRange),
  });
  return data.data; // { count }
};

export const getFormSubmissions = async (
  siteId,
  { page = 1, limit = 20, websiteType, submitFrom, email, search, period = '28d', dateRange = null } = {}
) => {
  const params = {
    page,
    limit,
    ...rangeParams(period, dateRange),
  };
  if (websiteType) params.websiteType = websiteType;
  if (submitFrom) params.submitFrom = submitFrom;
  if (email) params.email = email;
  if (search) params.search = search;

  const { data } = await api.get(`/api/sites/${siteId}/form-submissions`, { params });
  return { rows: data.data, meta: data.meta };
};
