import api from './axiosInstance';

export const downloadReport = async (siteId, range = '30d') => {
  const response = await api.get(`/api/sites/${siteId}/reports/pdf`, {
    params: { range },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `wp-sentinel-report-${range}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
