import axios from 'axios';
import { API_ENDPOINT } from './api';

const publicApi = axios.create({
  baseURL: API_ENDPOINT || '',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchSharedSite = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}`);
  return data.data;
};

export const fetchSharedChecks = async (token, params = {}) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/checks`, { params });
  return { checks: data.data, meta: data.meta };
};

export const fetchSharedCheckSummary = async (token, period = '24h') => {
  const { data } = await publicApi.get(`/api/public/share/${token}/checks/summary`, { params: { period } });
  return data.data;
};

export const fetchSharedSSL = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/ssl`);
  return data.data;
};

export const fetchSharedSecurity = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/security`);
  return data.data;
};

export const fetchSharedSeo = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/seo`);
  return data.data;
};

export const fetchSharedPlugins = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/plugins`);
  return data.data;
};

export const fetchSharedSiteScan = async (token) => {
  const { data } = await publicApi.get(`/api/public/share/${token}/sitescan`);
  return data.data;
};
