const BaseBacklinksProvider = require('./BaseProvider');

const SUMMARY_ENDPOINT = 'https://api.dataforseo.com/v3/backlinks/summary/live';
const BACKLINKS_LIST_ENDPOINT = 'https://api.dataforseo.com/v3/backlinks/backlinks/live';
const HISTORY_ENDPOINT = 'https://api.dataforseo.com/v3/backlinks/history/live';

function stripProtocol(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function callDataForSEO(endpoint, body, auth) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const e = new Error(`DataForSEO request failed: ${err.message}`);
    e.statusCode = 502;
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    const e = new Error('DataForSEO rate limit exceeded');
    e.statusCode = 429;
    throw e;
  }

  if (!response.ok) {
    const e = new Error(`DataForSEO API returned ${response.status}`);
    e.statusCode = 502;
    throw e;
  }

  const data = await response.json();

  if (data?.status_code && data.status_code !== 20000) {
    console.error('[DataForSEO] Top-level error:', data.status_code, data.status_message);
    const e = new Error(`DataForSEO: ${data.status_message || 'Unknown error'}`);
    e.statusCode = 502;
    throw e;
  }

  const task = data?.tasks?.[0];
  if (!task) {
    console.error('[DataForSEO] No task in response:', JSON.stringify(data).slice(0, 500));
    const e = new Error('DataForSEO returned no task data');
    e.statusCode = 502;
    throw e;
  }

  if (task.status_code && task.status_code !== 20000) {
    console.error('[DataForSEO] Task error:', task.status_code, task.status_message);
    const e = new Error(`DataForSEO: ${task.status_message || `Task error ${task.status_code}`}`);
    e.statusCode = task.status_code === 40501 ? 402 : 502; // 402 = payment required
    throw e;
  }

  return { data, task };
}

class DataForSEOProvider extends BaseBacklinksProvider {
  get name() {
    return 'dataforseo';
  }

  isConfigured() {
    return !!(this.config.email && this.config.password);
  }

  _auth() {
    return Buffer.from(`${this.config.email}:${this.config.password}`).toString('base64');
  }

  _assertConfigured() {
    if (!this.isConfigured()) {
      const err = new Error('DataForSEO credentials not configured');
      err.code = 'PROVIDER_NOT_CONFIGURED';
      err.statusCode = 503;
      throw err;
    }
  }

  async fetchSummary(domain) {
    this._assertConfigured();

    const target = stripProtocol(domain);
    const auth = this._auth();

    const { data, task } = await callDataForSEO(
      SUMMARY_ENDPOINT,
      [{ target, internal_list_limit: 10 }],
      auth
    );

    const result = task.result?.[0];
    if (!result) {
      console.warn('[DataForSEO] No result for target:', target, 'task:', JSON.stringify(task).slice(0, 500));
      // Return zeros rather than throwing — might be a new domain with no data yet
      return {
        domainRank: 0,
        backlinksCount: 0,
        referringDomains: 0,
        newLinksLast30d: 0,
        lostLinksLast30d: 0,
        providerName: 'dataforseo',
        providerMetric: 'domain_authority',
        raw: data,
      };
    }

    // Log raw result once for debugging so we can verify field names
    console.log('[DataForSEO] Raw result for', target, ':', JSON.stringify(result).slice(0, 1000));

    // DataForSEO rank is 0-1000 — normalize to 0-100
    const domainRank = typeof result.rank === 'number' ? Math.round(result.rank / 10) : 0;

    return {
      domainRank,
      backlinksCount: result.backlinks || 0,
      referringDomains: result.referring_domains || result.referring_main_domains || 0,
      newLinksLast30d: result.referring_domains_new_1m || result.backlinks_new_1m || 0,
      lostLinksLast30d: result.referring_domains_lost_1m || result.backlinks_lost_1m || 0,
      providerName: 'dataforseo',
      providerMetric: 'domain_authority',
      raw: result,
    };
  }

  async fetchHistory(domain, { months = 12 } = {}) {
    this._assertConfigured();

    const target = stripProtocol(domain);
    const auth = this._auth();

    const now = new Date();
    const dateTo = now.toISOString().slice(0, 10);
    const from = new Date(now);
    from.setMonth(from.getMonth() - months);
    const dateFrom = from.toISOString().slice(0, 10);

    const { data, task } = await callDataForSEO(
      HISTORY_ENDPOINT,
      [{ target, date_from: dateFrom, date_to: dateTo }],
      auth
    );

    const result = task.result?.[0];
    const rawItems = result?.items || [];

    // Log once so we can verify field names against live payload
    if (rawItems[0]) {
      console.log('[DataForSEO] History sample for', target, ':', JSON.stringify(rawItems[0]).slice(0, 500));
    }

    const history = rawItems.map((it) => ({
      monthKey: typeof it.date === 'string' ? it.date.slice(0, 7) : '',
      newDomains: it.new_referring_domains || 0,
      lostDomains: it.lost_referring_domains || 0,
      newBacklinks: it.new_backlinks || 0,
      lostBacklinks: it.lost_backlinks || 0,
      backlinks: it.backlinks || 0,
      referringDomains: it.referring_domains || 0,
      rank: typeof it.rank === 'number' ? Math.round(it.rank / 10) : 0,
    })).filter((h) => h.monthKey);

    return { history, raw: data };
  }

  async fetchBacklinksList(domain, { limit = 100 } = {}) {
    this._assertConfigured();

    const target = stripProtocol(domain);
    const auth = this._auth();

    const { data, task } = await callDataForSEO(
      BACKLINKS_LIST_ENDPOINT,
      [{ target, limit, mode: 'as_is', order_by: ['last_seen,desc'] }],
      auth
    );

    const result = task.result?.[0];
    const rawItems = result?.items || [];

    const items = rawItems.map((it) => ({
      sourceUrl: it.url_from || '',
      targetUrl: it.url_to || '',
      anchor: it.anchor || '',
      doFollow: !!it.dofollow,
      firstSeen: it.first_seen ? new Date(it.first_seen) : null,
      lastSeen: it.last_seen ? new Date(it.last_seen) : null,
      linkType: it.item_type || 'anchor',
      domainFromRank: typeof it.rank === 'number' ? Math.round(it.rank / 10) : 0,
    }));

    return { items, raw: data };
  }
}

module.exports = DataForSEOProvider;
