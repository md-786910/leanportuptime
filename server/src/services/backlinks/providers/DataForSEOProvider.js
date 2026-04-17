const BaseBacklinksProvider = require('./BaseProvider');

const DATAFORSEO_ENDPOINT = 'https://api.dataforseo.com/v3/backlinks/summary/live';

function stripProtocol(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

class DataForSEOProvider extends BaseBacklinksProvider {
  get name() {
    return 'dataforseo';
  }

  isConfigured() {
    return !!(this.config.email && this.config.password);
  }

  async fetchSummary(domain) {
    if (!this.isConfigured()) {
      const err = new Error('DataForSEO credentials not configured');
      err.code = 'PROVIDER_NOT_CONFIGURED';
      err.statusCode = 503;
      throw err;
    }

    const target = stripProtocol(domain);
    const auth = Buffer.from(`${this.config.email}:${this.config.password}`).toString('base64');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(DATAFORSEO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ target, internal_list_limit: 10 }]),
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

    // DataForSEO returns HTTP 200 but embeds errors at task level
    // Top-level status_code: 20000 = success
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

    // Task-level status (e.g. 40501 = not enough credits, 40400 = not found)
    if (task.status_code && task.status_code !== 20000) {
      console.error('[DataForSEO] Task error:', task.status_code, task.status_message, 'target:', target);
      const e = new Error(`DataForSEO: ${task.status_message || `Task error ${task.status_code}`}`);
      e.statusCode = task.status_code === 40501 ? 402 : 502; // 402 = payment required
      throw e;
    }

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
        providerMetric: 'domain_rank',
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
      providerMetric: 'domain_rank',
      raw: result,
    };
  }
}

module.exports = DataForSEOProvider;
