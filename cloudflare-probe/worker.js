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

// POST /ssl — HTTPS certificate validity check
async function handleSSL(body, env) {
  const { url } = body;
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: defaultHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    const responseTime = Date.now() - start;
    return Response.json({
      isValid: true,
      httpStatus: res.status,
      responseTime,
      error: null,
    });
  } catch (err) {
    return Response.json({
      isValid: false,
      httpStatus: null,
      responseTime: Date.now() - start,
      error: err.message,
    });
  }
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
