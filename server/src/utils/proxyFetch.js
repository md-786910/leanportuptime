const http = require('http');
const https = require('https');
const { URL } = require('url');
const config = require('../config');
const logger = require('./logger');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BLOCKED_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH',
  'EPIPE', 'EAI_AGAIN',
  // TLS-level failures should also trigger the Cloudflare proxy fallback —
  // they mean we couldn't reach or negotiate with the host from this network,
  // exactly the scenario the proxy exists for.
  'EPROTO', 'ECONNABORTED', 'ENETUNREACH',
]);

function isBlockedError(err) {
  if (!err) return false;
  if (BLOCKED_CODES.has(err.code)) return true;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('socket hang up') ||
    msg.includes('handshake failure') ||
    msg.includes('ssl alert') ||
    msg.includes('wrong version number')
  );
}

function getProbe() {
  if (!config.probes || !config.probes.length) return null;
  return { url: config.probes[0].url, secret: config.probeSecret };
}

// Returns probes ordered so region-matching ones come first.
// Probe names with a TLD prefix (e.g. "at-vps") are prioritised for that TLD.
// e.g. hostname "www.example.at" → probes named "at-*" sort to the front.
function getProbesForHost(hostname) {
  if (!config.probes || !config.probes.length) return [];
  const tld = (hostname || '').split('.').pop().toLowerCase();
  return [...config.probes].sort((a, b) => {
    const aMatch = a.name.toLowerCase().startsWith(tld + '-') ? -1 : 0;
    const bMatch = b.name.toLowerCase().startsWith(tld + '-') ? -1 : 0;
    return aMatch - bMatch;
  });
}

// Call a single probe's /fetch endpoint
async function _callOneProbeFetch(probeUrl, secret, url, { method = 'GET', followRedirects = true } = {}) {
  const res = await fetch(`${probeUrl}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, secret, followRedirects }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Probe returned HTTP ${res.status}`);
  const data = await res.json();
  if (data.error && data.statusCode === null) throw new Error(data.error);
  return data;
}

// Call Cloudflare Worker /fetch endpoint, trying region-matched probes first
async function callProxyFetch(url, { method = 'GET', followRedirects = true } = {}) {
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { /* ignore */ }
  const probes = getProbesForHost(hostname);
  if (!probes.length) throw new Error('No probe configured for fallback');

  let lastErr;
  for (const probe of probes) {
    try {
      return await _callOneProbeFetch(probe.url, config.probeSecret, url, { method, followRedirects });
    } catch (err) {
      lastErr = err;
      logger.debug(`Probe ${probe.name} fetch failed: ${err.message}, trying next`);
    }
  }
  throw lastErr;
}

// Call Cloudflare Worker /ssl endpoint
async function callProxySSL(url) {
  const probe = getProbe();
  if (!probe) throw new Error('No Cloudflare probe configured for fallback');

  const probeUrl = `${probe.url}/ssl`;
  const payload = JSON.stringify({ url, secret: probe.secret });

  const res = await fetch(probeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`Cloudflare proxy returned HTTP ${res.status}`);
  return res.json();
}

// Direct HTTP GET (same pattern as existing services)
function directGet(url, { timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout,
        headers: { 'User-Agent': UA },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.end();
  });
}

// Direct HTTP GET with timing (for sitescan)
function directGetTimed(url, { timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout,
        headers: { 'User-Agent': UA },
      },
      (res) => {
        let body = '';
        let size = 0;
        const maxSize = 5 * 1024 * 1024;
        res.on('data', (chunk) => {
          size += chunk.length;
          if (size <= maxSize) body += chunk;
        });
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            responseTime: Date.now() - start,
          })
        );
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.end();
  });
}

// Direct HTTP request (HEAD / POST / etc.)
function directRequest(url, method, { timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        timeout,
        headers: { 'User-Agent': UA },
      },
      (res) => { res.resume(); resolve({ statusCode: res.statusCode, headers: res.headers }); }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.end();
  });
}

// ========== PUBLIC API (direct → Cloudflare fallback) ==========

async function httpGet(url, { timeout = 10000, followRedirects = true } = {}) {
  try {
    return await directGet(url, { timeout });
  } catch (err) {
    if (!isBlockedError(err)) throw err;
    logger.info(`Direct GET to ${url} blocked (${err.code || err.message}), falling back to Cloudflare proxy`);
    const data = await callProxyFetch(url, { method: 'GET', followRedirects });
    return { statusCode: data.statusCode, headers: data.headers, body: data.body };
  }
}

async function httpHead(url, { timeout = 10000, followRedirects = true } = {}) {
  try {
    return await directRequest(url, 'HEAD', { timeout });
  } catch (err) {
    if (!isBlockedError(err)) throw err;
    logger.info(`Direct HEAD to ${url} blocked (${err.code || err.message}), falling back to Cloudflare proxy`);
    const data = await callProxyFetch(url, { method: 'HEAD', followRedirects });
    return { statusCode: data.statusCode, headers: data.headers };
  }
}

async function httpRequest(url, method, { timeout = 10000, followRedirects = true } = {}) {
  try {
    return await directRequest(url, method, { timeout });
  } catch (err) {
    if (!isBlockedError(err)) throw err;
    logger.info(`Direct ${method} to ${url} blocked (${err.code || err.message}), falling back to Cloudflare proxy`);
    const data = await callProxyFetch(url, { method, followRedirects });
    return { statusCode: data.statusCode, headers: data.headers };
  }
}

async function httpGetTimed(url, { timeout = 15000 } = {}) {
  try {
    return await directGetTimed(url, { timeout });
  } catch (err) {
    if (!isBlockedError(err)) throw err;
    logger.info(`Direct timed GET to ${url} blocked (${err.code || err.message}), falling back to Cloudflare proxy`);
    const data = await callProxyFetch(url, { method: 'GET' });
    return {
      statusCode: data.statusCode,
      headers: data.headers,
      body: data.body,
      responseTime: data.responseTime,
    };
  }
}

// Call probes' /check endpoint, trying region-matched ones first.
// Returns the first result that isn't a connection-level failure (httpStatus !== null),
// falling back to the last result if all probes get network errors.
async function proxyCheck(siteUrl) {
  let hostname = '';
  try { hostname = new URL(siteUrl).hostname; } catch { /* ignore */ }
  const probes = getProbesForHost(hostname);
  if (!probes.length) throw new Error('No probe configured for fallback');

  let lastResult = null;
  for (const probe of probes) {
    try {
      const res = await fetch(`${probe.url}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl, secret: config.probeSecret }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) { lastResult = { status: 'down', httpStatus: null, error: `Probe HTTP ${res.status}` }; continue; }
      const data = await res.json();
      lastResult = data;
      // If the site responded with any HTTP status (even 4xx), it's reachable — stop here
      if (data.httpStatus !== null && data.httpStatus !== undefined) return data;
      // Connection-level failure — try next probe
      logger.debug(`Probe ${probe.name} got connection error for ${hostname}, trying next`);
    } catch (err) {
      logger.debug(`Probe ${probe.name} unreachable: ${err.message}, trying next`);
      lastResult = { status: 'down', httpStatus: null, error: err.message };
    }
  }
  return lastResult || { status: 'down', httpStatus: null, error: 'All probes failed' };
}

async function proxySSLCheck(siteUrl) {
  try {
    const data = await callProxySSL(siteUrl);
    // Handle both new /ssl format (isValid) and legacy /check format (status: 'up')
    const isValid = data.isValid === true || data.status === 'up' || data.status === 'degraded';

    // The worker now returns cert details from certspotter alongside the live signal.
    // Surface them so ssl.service can avoid querying CT logs again.
    const cert = data.validTo
      ? {
          issuer: data.issuerO || data.issuer || 'Unknown',
          subject: data.subject || null,
          validFrom: data.validFrom ? new Date(data.validFrom) : null,
          validTo: new Date(data.validTo),
          serialNumber: data.serialNumber || null,
          fingerprint: data.fingerprint || null,
        }
      : null;

    return { isValid, error: data.error || null, source: 'cloudflare', cert };
  } catch (err) {
    return { isValid: false, error: `Cloudflare SSL proxy failed: ${err.message}`, source: 'cloudflare', cert: null };
  }
}

module.exports = { httpGet, httpHead, httpRequest, httpGetTimed, proxySSLCheck, proxyCheck, callProxyFetch, isBlockedError, UA };
