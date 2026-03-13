export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    let body;
    try { body = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }

    const { url, secret } = body;
    if (!url || secret !== env.PROBE_SECRET) return new Response('Unauthorized', { status: 401 });

    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'WP-Sentinel-Probe/1.0' },
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
  },
};
