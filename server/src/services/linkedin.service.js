const config = require('../config');
const logger = require('../utils/logger');

const API_BASE = 'https://api.linkedin.com/rest';
const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map();
let accessToken = config.linkedin.accessToken;

function isEnabled(siteId) {
  return !!config.linkedin.projects[String(siteId)];
}

async function refreshAccessToken() {
  const { refreshToken, clientId, clientSecret } = config.linkedin;
  if (!refreshToken || !clientId || !clientSecret) return false;

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    logger.error(`LinkedIn token refresh failed: ${res.status} ${await res.text()}`);
    return false;
  }
  accessToken = (await res.json()).access_token;
  return true;
}

async function apiGet(path, retried = false) {
  if (!accessToken) {
    const err = new Error('LinkedIn is not configured (LINKEDIN_ACCESS_TOKEN missing)');
    err.statusCode = 503;
    throw err;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': config.linkedin.apiVersion,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (res.status === 401 && !retried && (await refreshAccessToken())) {
    return apiGet(path, true);
  }
  if (!res.ok) {
    const body = await res.text();
    logger.error(`LinkedIn API ${res.status} on ${path}: ${body}`);
    const err = new Error(
      res.status === 401 || res.status === 403
        ? 'LinkedIn access token lacks ad reporting permission (r_ads_reporting) for this ad account'
        : `LinkedIn API error (${res.status})`
    );
    err.statusCode = 502;
    throw err;
  }
  return res.json();
}

// Rest.li date: (year:2026,month:10,day:1)
function restliDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `(year:${year},month:${month},day:${day})`;
}

const ratio = (a, b) => (b > 0 ? a / b : null);

/**
 * Account-level ad metrics for a date range (inclusive, YYYY-MM-DD).
 * Leads = Lead Gen Form leads + website conversions.
 */
async function getMetrics(siteId, startDate, endDate) {
  const accountId = config.linkedin.projects[String(siteId)];
  const cacheKey = `${accountId}:${startDate}:${endDate}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);
  const fields = 'costInLocalCurrency,impressions,clicks,oneClickLeads,externalWebsiteConversions';
  const query =
    `?q=analytics&pivot=ACCOUNT&timeGranularity=ALL` +
    `&dateRange=(start:${restliDate(startDate)},end:${restliDate(endDate)})` +
    `&accounts=List(${accountUrn})&fields=${fields}`;

  const [analytics, account] = await Promise.all([
    apiGet(`/adAnalytics${query}`),
    apiGet(`/adAccounts/${accountId}`).catch(() => null),
  ]);

  const row = analytics.elements?.[0] || {};
  const cost = parseFloat(row.costInLocalCurrency || 0);
  const impressions = row.impressions || 0;
  const clicks = row.clicks || 0;
  const leads = (row.oneClickLeads || 0) + (row.externalWebsiteConversions || 0);

  const data = {
    currency: account?.currency || null,
    cost,
    leads,
    costPerLead: ratio(cost, leads),
    clicks,
    impressions,
    ctr: ratio(clicks, impressions),
    costPerClick: ratio(cost, clicks),
    conversionRate: ratio(leads, clicks),
    startDate,
    endDate,
    fetchedAt: new Date(),
  };
  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

module.exports = { isEnabled, getMetrics };
