const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_BODY = 1024 * 1024; // 1MB cap

function validateSecret(body, env) {
  if (!body || !body.secret || body.secret !== env.PROBE_SECRET) return false;
  return true;
}

function defaultHeaders() {
  return {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };
}

// POST /check — existing uptime probe (unchanged behavior)
async function handleCheck(body, env) {
  const { url } = body;
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    const responseTime = Date.now() - start;
    return Response.json({
      status: res.ok ? (responseTime > 5000 ? 'degraded' : 'up') : 'down',
      httpStatus: res.status,
      responseTime,
      location: env.LOCATION || 'cloudflare',
      error: null,
    });
  } catch (err) {
    return Response.json({
      status: 'down',
      httpStatus: null,
      responseTime: Date.now() - start,
      location: env.LOCATION || 'cloudflare',
      error: err.message,
    });
  }
}

// POST /fetch — generic URL proxy for fallback
async function handleFetch(body, env) {
  const { url, method = 'GET', followRedirects = true } = body;
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const start = Date.now();
  try {
    const fetchOpts = {
      method,
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(15000),
    };
    if (!followRedirects) fetchOpts.redirect = 'manual';

    const res = await fetch(url, fetchOpts);
    const responseTime = Date.now() - start;

    // Serialize headers
    const headers = {};
    for (const [key, value] of res.headers) {
      headers[key] = value;
    }

    // Read body with size cap (only for GET)
    let responseBody = '';
    let truncated = false;
    if (method === 'GET') {
      const text = await res.text();
      if (text.length > MAX_BODY) {
        responseBody = text.slice(0, MAX_BODY);
        truncated = true;
      } else {
        responseBody = text;
      }
    }

    return Response.json({
      statusCode: res.status,
      headers,
      body: responseBody,
      responseTime,
      truncated,
      error: null,
    });
  } catch (err) {
    return Response.json({
      statusCode: null,
      headers: {},
      body: '',
      responseTime: Date.now() - start,
      truncated: false,
      error: err.message,
    });
  }
}

// Parse "C=US, O=Let's Encrypt, CN=R12" into { O, CN, ... }
function parseIssuerDN(dn) {
  if (!dn || typeof dn !== 'string') return {};
  return dn.split(',').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k && v.length) acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});
}

// SAN match: hostname matches any of the dns_names (handles wildcards)
function sanCovers(dnsNames, hostname) {
  if (!Array.isArray(dnsNames)) return false;
  const host = hostname.toLowerCase();
  return dnsNames.some((name) => {
    const n = String(name).toLowerCase();
    if (n === host) return true;
    if (n.startsWith('*.')) {
      const base = n.slice(2);
      return host.endsWith('.' + base) && host.split('.').length === base.split('.').length + 1;
    }
    return false;
  });
}

// Query certspotter for cert details. Try the requested hostname first;
// if no covering cert is found, retry against the apex (strip leading "www.").
async function fetchCertFromCertspotter(hostname) {
  const tryHost = async (h) => {
    const url = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(h)}&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WP-Sentinel-Probe/2.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const certs = await res.json();
    if (!Array.isArray(certs) || certs.length === 0) return null;

    const now = new Date();
    const candidates = certs
      .filter((c) => c && !c.revoked && c.not_after && new Date(c.not_after) > now)
      .filter((c) => sanCovers(c.dns_names, hostname))
      .sort((a, b) => new Date(b.not_before) - new Date(a.not_before));

    return candidates[0] || null;
  };

  let cert = null;
  try { cert = await tryHost(hostname); } catch { /* fall through */ }
  if (!cert && hostname.toLowerCase().startsWith('www.')) {
    try { cert = await tryHost(hostname.slice(4)); } catch { /* ignore */ }
  }
  if (!cert) return null;

  const issuerDN = parseIssuerDN(cert.issuer && cert.issuer.name);
  return {
    issuer: issuerDN.CN || (cert.issuer && cert.issuer.friendly_name) || 'Unknown',
    issuerO: issuerDN.O || (cert.issuer && cert.issuer.friendly_name) || null,
    subject: (cert.dns_names && cert.dns_names[0]) || hostname,
    validFrom: cert.not_before || null,
    validTo: cert.not_after || null,
    serialNumber: null, // certspotter does not expose serial directly without DER parsing
    fingerprint: cert.cert_sha256 || null,
    dnsNames: cert.dns_names || null,
  };
}

// Live HEAD over the host's TLS. Cloudflare's fetch validates the cert internally,
// so a successful HEAD is a reliable "cert is being served and is currently valid"
// signal. Returns { ok, httpStatus, error }.
async function liveHttpsHead(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    return { ok: true, httpStatus: res.status, error: null };
  } catch (err) {
    return { ok: false, httpStatus: null, error: err.message };
  }
}

// POST /ssl — HTTPS certificate validity + details
async function handleSSL(body, env) {
  const { url } = body;
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  let parsed;
  try { parsed = new URL(url); } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:') {
    return Response.json({ isValid: false, error: 'Site does not use HTTPS' });
  }

  const start = Date.now();
  const [live, cert] = await Promise.all([
    liveHttpsHead(url),
    fetchCertFromCertspotter(parsed.hostname).catch(() => null),
  ]);
  const responseTime = Date.now() - start;

  return Response.json({
    isValid: live.ok,
    httpStatus: live.httpStatus,
    responseTime,
    error: live.error,
    issuer: cert ? cert.issuer : null,
    issuerO: cert ? cert.issuerO : null,
    subject: cert ? cert.subject : null,
    validFrom: cert ? cert.validFrom : null,
    validTo: cert ? cert.validTo : null,
    serialNumber: cert ? cert.serialNumber : null,
    fingerprint: cert ? cert.fingerprint : null,
    dnsNames: cert ? cert.dnsNames : null,
    source: cert ? (live.ok ? 'fetch+certspotter' : 'certspotter') : (live.ok ? 'fetch' : null),
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    if (!validateSecret(body, env)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const path = new URL(request.url).pathname;

    switch (path) {
      case '/check':
        return handleCheck(body, env);
      case '/fetch':
        return handleFetch(body, env);
      case '/ssl':
        return handleSSL(body, env);
      default:
        return new Response('Not found', { status: 404 });
    }
  },
};
