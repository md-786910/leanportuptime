const http = require('http');
const https = require('https');
const { URL } = require('url');
const config = require('../config');
const logger = require('./logger');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BLOCKED_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH',
  'EPIPE', 'EAI_AGAIN',
]);

function isBlockedError(err) {
  if (!err) return false;
  if (BLOCKED_CODES.has(err.code)) return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('socket hang up');
}

function getProbe() {
  if (!config.probes || !config.probes.length) return null;
  return { url: config.probes[0].url, secret: config.probeSecret };
}

// Call Cloudflare Worker /fetch endpoint
async function callProxyFetch(url, { method = 'GET', followRedirects = true } = {}) {
  const probe = getProbe();
  if (!probe) throw new Error('No Cloudflare probe configured for fallback');

  const probeUrl = `${probe.url}/fetch`;
  const payload = JSON.stringify({ url, method, secret: probe.secret, followRedirects });

  const res = await fetch(probeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`Cloudflare proxy returned HTTP ${res.status}`);
  const data = await res.json();
  if (data.error && data.statusCode === null) {
    throw new Error(`Cloudflare proxy fetch failed: ${data.error}`);
  }
  return data;
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

async function proxySSLCheck(siteUrl) {
  try {
    const data = await callProxySSL(siteUrl);
    // Handle both new /ssl format (isValid) and legacy /check format (status: 'up')
    const isValid = data.isValid === true || data.status === 'up' || data.status === 'degraded';
    return { isValid, error: data.error || null, source: 'cloudflare' };
  } catch (err) {
    return { isValid: false, error: `Cloudflare SSL proxy failed: ${err.message}`, source: 'cloudflare' };
  }
}

module.exports = { httpGet, httpHead, httpRequest, httpGetTimed, proxySSLCheck, isBlockedError, UA };
