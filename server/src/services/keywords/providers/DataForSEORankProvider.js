const BaseKeywordsProvider = require('./BaseProvider');

const SERP_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
const KEYWORD_OVERVIEW_ENDPOINT = 'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live';

function stripProtocol(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
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
    const e = new Error(`DataForSEO: ${data.status_message || 'Unknown error'}`);
    e.statusCode = 502;
    throw e;
  }

  const task = data?.tasks?.[0];
  if (!task) {
    const e = new Error('DataForSEO returned no task data');
    e.statusCode = 502;
    throw e;
  }

  if (task.status_code && task.status_code !== 20000) {
    const e = new Error(`DataForSEO: ${task.status_message || `Task error ${task.status_code}`}`);
    e.statusCode = task.status_code === 40501 ? 402 : 502;
    throw e;
  }

  return { data, task };
}

class DataForSEORankProvider extends BaseKeywordsProvider {
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

  async fetchRank(keyword, { locationCode, languageCode, targetDomain }) {
    this._assertConfigured();

    const { task } = await callDataForSEO(
      SERP_ENDPOINT,
      [{ keyword, location_code: locationCode, language_code: languageCode, depth: 100 }],
      this._auth()
    );

    const result = task.result?.[0];
    const items = result?.items || [];
    const normalizedDomain = stripProtocol(targetDomain);

    const match = items.find((it) => {
      if (it.type && it.type !== 'organic') return false;
      const d = typeof it.domain === 'string' ? it.domain.toLowerCase() : '';
      return d === normalizedDomain || d.endsWith(`.${normalizedDomain}`);
    });

    return {
      position: typeof match?.rank_absolute === 'number' ? match.rank_absolute : null,
      url: match?.url || null,
      raw: result,
    };
  }

  async fetchMetrics(keywords, { locationCode, languageCode }) {
    this._assertConfigured();
    if (!keywords?.length) return {};

    const { data, task } = await callDataForSEO(
      KEYWORD_OVERVIEW_ENDPOINT,
      [{
        keywords,
        location_code: locationCode,
        language_code: languageCode,
        include_serp_info: false,
      }],
      this._auth()
    );

    const items = task.result?.[0]?.items || [];
    if (items[0]) {
      // Log first payload once so field names can be verified in prod logs
      console.log('[DataForSEO] Keyword overview sample:', JSON.stringify(items[0]).slice(0, 800));
    }

    const map = {};
    for (const r of items) {
      const kw = r.keyword;
      if (!kw) continue;
      const ki = r.keyword_info || {};
      const kp = r.keyword_properties || {};
      map[kw] = {
        searchVolume: typeof ki.search_volume === 'number' ? ki.search_volume : null,
        keywordDifficulty: typeof kp.keyword_difficulty === 'number' ? kp.keyword_difficulty : null,
        cpc: typeof ki.cpc === 'number' ? ki.cpc : null,
        competition: typeof ki.competition === 'number' ? ki.competition : null,
        monthlySearches: Array.isArray(ki.monthly_searches)
          ? ki.monthly_searches.map((m) => ({
              year: m.year,
              month: m.month,
              searchVolume: m.search_volume || 0,
            }))
          : [],
      };
    }

    return { map, raw: data };
  }
}

module.exports = DataForSEORankProvider;
