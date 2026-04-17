const { google } = require('googleapis');
const config = require('../config');
const User = require('../models/User');

class SearchConsoleService {
  _createOAuth2Client() {
    return new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  /**
   * Generate the Google OAuth consent URL.
   * State param carries userId so the callback can identify the user.
   */
  getAuthUrl(userId) {
    const oauth2Client = this._createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly',
      ],
      state: userId.toString(),
    });
  }

  /**
   * Exchange authorization code for tokens, store on User.
   */
  async handleCallback(code, userId) {
    const oauth2Client = this._createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Get Google email from the tokens
    oauth2Client.setCredentials(tokens);
    let email = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      email = data.email;
    } catch {
      // Non-critical — email is just for display
    }

    await User.findByIdAndUpdate(userId, {
      'google.accessToken': tokens.access_token,
      'google.refreshToken': tokens.refresh_token || null,
      'google.email': email,
      'google.connectedAt': new Date(),
    });

    return { email };
  }

  /**
   * Build an authenticated OAuth2 client for a user.
   * Automatically refreshes if the access token is expired.
   */
  async _getAuthClient(user) {
    // Reload fresh tokens from DB
    const freshUser = await User.findById(user._id).select('+google.accessToken +google.refreshToken');
    if (!freshUser?.google?.accessToken) {
      throw Object.assign(new Error('Google account not connected'), { statusCode: 400 });
    }

    const oauth2Client = this._createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: freshUser.google.accessToken,
      refresh_token: freshUser.google.refreshToken,
    });

    // Listen for automatic token refresh
    oauth2Client.on('tokens', async (tokens) => {
      const update = { 'google.accessToken': tokens.access_token };
      if (tokens.refresh_token) {
        update['google.refreshToken'] = tokens.refresh_token;
      }
      await User.findByIdAndUpdate(user._id, update);
    });

    return oauth2Client;
  }

  /**
   * List all Search Console properties the user has access to.
   */
  async listProperties(user) {
    const auth = await this._getAuthClient(user);
    const webmasters = google.searchconsole({ version: 'v1', auth });
    const { data } = await webmasters.sites.list();
    return (data.siteEntry || []).map((entry) => ({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel,
    }));
  }

  /**
   * Fetch Search Console performance data.
   * @param {Object} user - Mongoose user document
   * @param {string} siteProperty - GSC property URL (e.g. 'https://example.com/')
   * @param {Object} options
   * @param {string} options.startDate - YYYY-MM-DD
   * @param {string} options.endDate - YYYY-MM-DD
   * @param {string[]} [options.dimensions] - e.g. ['date']
   */
  async getPerformance(user, siteProperty, { startDate, endDate, dimensions }) {
    const auth = await this._getAuthClient(user);
    const webmasters = google.searchconsole({ version: 'v1', auth });

    const requestBody = {
      startDate,
      endDate,
      dimensions: dimensions || [],
    };

    const { data } = await webmasters.searchanalytics.query({
      siteUrl: siteProperty,
      requestBody,
    });

    // Compute totals from response
    const rows = data.rows || [];

    if (dimensions && dimensions.includes('date')) {
      // Daily breakdown
      const daily = rows.map((row) => ({
        date: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));

      // Calculate totals from daily data
      const totals = daily.reduce(
        (acc, day) => {
          acc.clicks += day.clicks;
          acc.impressions += day.impressions;
          return acc;
        },
        { clicks: 0, impressions: 0 }
      );
      totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
      totals.position =
        daily.length > 0
          ? daily.reduce((sum, d) => sum + d.position, 0) / daily.length
          : 0;

      return { totals, daily, fetchedAt: new Date() };
    }

    // Aggregate (no dimensions) — single row
    if (rows.length > 0) {
      const row = rows[0];
      return {
        totals: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
        daily: [],
        fetchedAt: new Date(),
      };
    }

    return {
      totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      daily: [],
      fetchedAt: new Date(),
    };
  }

  /**
   * Fetch SEO insights — top queries, pages, devices, countries in parallel.
   * @param {Object} user
   * @param {string} siteProperty
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @param {number} rowLimit - max rows per dimension
   */
  async getInsights(user, siteProperty, { startDate, endDate, rowLimit = 10 }) {
    const auth = await this._getAuthClient(user);
    const webmasters = google.searchconsole({ version: 'v1', auth });

    const queryDimension = async (dimensions) => {
      const { data } = await webmasters.searchanalytics.query({
        siteUrl: siteProperty,
        requestBody: { startDate, endDate, dimensions, rowLimit },
      });
      return data.rows || [];
    };

    const [queryRows, pageRows, deviceRows, countryRows] = await Promise.allSettled([
      queryDimension(['query']),
      queryDimension(['page']),
      queryDimension(['device']),
      queryDimension(['country']),
    ]);

    const mapRows = (result, keyName) => {
      if (result.status !== 'fulfilled') return [];
      return result.value.map((row) => ({
        [keyName]: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    };

    return {
      queries: mapRows(queryRows, 'query'),
      pages: mapRows(pageRows, 'page'),
      devices: mapRows(deviceRows, 'device'),
      countries: mapRows(countryRows, 'country'),
      fetchedAt: new Date(),
    };
  }

  /**
   * Disconnect Google account — clear tokens from User.
   */
  async disconnect(userId) {
    await User.findByIdAndUpdate(userId, {
      'google.accessToken': null,
      'google.refreshToken': null,
      'google.email': null,
      'google.connectedAt': null,
    });
  }
}

module.exports = new SearchConsoleService();
