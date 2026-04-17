const { google } = require('googleapis');
const config = require('../config');
const User = require('../models/User');

const ORGANIC_FILTER = {
  filter: {
    fieldName: 'sessionDefaultChannelGroup',
    stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
  },
};

class AnalyticsService {
  _createOAuth2Client() {
    return new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  async _getAuthClient(user) {
    const freshUser = await User.findById(user._id).select('+google.accessToken +google.refreshToken');
    if (!freshUser?.google?.accessToken) {
      throw Object.assign(new Error('Google account not connected'), { statusCode: 400 });
    }

    const oauth2Client = this._createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: freshUser.google.accessToken,
      refresh_token: freshUser.google.refreshToken,
    });

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
   * List GA4 properties the user has access to.
   */
  async listProperties(user) {
    const auth = await this._getAuthClient(user);
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    const { data: accountsData } = await analyticsAdmin.accounts.list();
    const accounts = accountsData.accounts || [];

    const properties = [];
    for (const account of accounts) {
      const { data: propsData } = await analyticsAdmin.properties.list({
        filter: `parent:${account.name}`,
      });
      for (const prop of propsData.properties || []) {
        properties.push({
          propertyId: prop.name, // e.g. "properties/123456789"
          displayName: prop.displayName,
          accountName: account.displayName,
        });
      }
    }

    return properties;
  }

  /**
   * Fetch organic overview metrics.
   */
  async getOrganicOverview(user, propertyId, { startDate, endDate }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
        ],
        dimensionFilter: ORGANIC_FILTER,
      },
    });

    const row = data.rows?.[0];
    if (!row) {
      return {
        sessions: 0,
        users: 0,
        newUsers: 0,
        returningUsers: 0,
        bounceRate: 0,
        engagementRate: 0,
        avgEngagementTime: 0,
        conversions: 0,
        fetchedAt: new Date(),
      };
    }

    const vals = row.metricValues.map((v) => parseFloat(v.value) || 0);
    const [sessions, users, newUsers, bounceRate, engagementRate, avgEngagementTime, conversions] = vals;

    return {
      sessions,
      users,
      newUsers,
      returningUsers: Math.max(0, users - newUsers),
      bounceRate,
      engagementRate,
      avgEngagementTime,
      conversions,
      fetchedAt: new Date(),
    };
  }

  /**
   * Fetch daily organic trend data.
   */
  async getOrganicTrend(user, propertyId, { startDate, endDate }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionDefaultChannelGroup' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'conversions' },
          { name: 'engagementRate' },
        ],
        dimensionFilter: ORGANIC_FILTER,
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    });

    return (data.rows || []).map((row) => ({
      date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      sessions: parseFloat(row.metricValues[0].value) || 0,
      conversions: parseFloat(row.metricValues[1].value) || 0,
      engagementRate: parseFloat(row.metricValues[2].value) || 0,
    }));
  }

  /**
   * Fetch organic landing pages.
   */
  async getOrganicLandingPages(user, propertyId, { startDate, endDate, rowLimit = 10 }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
        ],
        dimensionFilter: ORGANIC_FILTER,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: rowLimit,
      },
    });

    return (data.rows || []).map((row) => ({
      page: row.dimensionValues[0].value,
      sessions: parseFloat(row.metricValues[0].value) || 0,
      bounceRate: parseFloat(row.metricValues[1].value) || 0,
      engagementRate: parseFloat(row.metricValues[2].value) || 0,
      avgDuration: parseFloat(row.metricValues[3].value) || 0,
      conversions: parseFloat(row.metricValues[4].value) || 0,
    }));
  }

  /**
   * Fetch organic device breakdown.
   */
  async getOrganicByDevice(user, propertyId, { startDate, endDate }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
        ],
        dimensionFilter: ORGANIC_FILTER,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      },
    });

    return (data.rows || []).map((row) => ({
      device: row.dimensionValues[0].value,
      sessions: parseFloat(row.metricValues[0].value) || 0,
      users: parseFloat(row.metricValues[1].value) || 0,
    }));
  }

  /**
   * Fetch organic country breakdown.
   */
  async getOrganicByCountry(user, propertyId, { startDate, endDate, rowLimit = 10 }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'engagementRate' },
        ],
        dimensionFilter: ORGANIC_FILTER,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: rowLimit,
      },
    });

    return (data.rows || []).map((row) => ({
      country: row.dimensionValues[0].value,
      sessions: parseFloat(row.metricValues[0].value) || 0,
      users: parseFloat(row.metricValues[1].value) || 0,
      engagementRate: parseFloat(row.metricValues[2].value) || 0,
    }));
  }

  // =============== Website (all traffic) methods ===============

  /**
   * Fetch all-traffic website overview KPIs.
   */
  async getWebsiteOverview(user, propertyId, { startDate, endDate }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    const row = data.rows?.[0];
    if (!row) {
      return { uniqueVisitors: 0, bounceRate: 0, avgTimeOnPage: 0, fetchedAt: new Date() };
    }

    const vals = row.metricValues.map((v) => parseFloat(v.value) || 0);
    return {
      uniqueVisitors: vals[0],
      bounceRate: vals[1],
      avgTimeOnPage: vals[2],
      fetchedAt: new Date(),
    };
  }

  /**
   * Fetch top pages by page views (all traffic).
   */
  async getWebsiteTopPages(user, propertyId, { startDate, endDate, rowLimit = 5 }) {
    const auth = await this._getAuthClient(user);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: rowLimit,
      },
    });

    return (data.rows || []).map((row) => ({
      page: row.dimensionValues[0].value,
      pageViews: parseFloat(row.metricValues[0].value) || 0,
    }));
  }

  /**
   * Fetch website details: events, channels, top pages in parallel.
   */
  async getWebsiteDetails(user, propertyId, { startDate, endDate }) {
    const FORM_EVENT_NAMES = [
      'generate_lead', 'form_submit', 'contact_form',
      'form_submission', 'contact_form_submit', 'wpforms_submit',
    ];

    const fetchEvents = async () => {
      const auth = await this._getAuthClient(user);
      const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

      const { data } = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 50,
        },
      });

      let fileDownloads = 0;
      let formRequests = 0;
      for (const row of data.rows || []) {
        const eventName = row.dimensionValues[0].value;
        const count = parseFloat(row.metricValues[0].value) || 0;
        if (eventName === 'file_download') fileDownloads = count;
        if (FORM_EVENT_NAMES.includes(eventName)) formRequests += count;
      }
      return { fileDownloads, formRequests };
    };

    const fetchChannels = async () => {
      const auth = await this._getAuthClient(user);
      const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

      const { data } = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        },
      });

      return (data.rows || []).map((row) => ({
        channel: row.dimensionValues[0].value,
        sessions: parseFloat(row.metricValues[0].value) || 0,
        users: parseFloat(row.metricValues[1].value) || 0,
      }));
    };

    const [events, channels, topPages] = await Promise.allSettled([
      fetchEvents(),
      fetchChannels(),
      this.getWebsiteTopPages(user, propertyId, { startDate, endDate }),
    ]);

    return {
      events: events.status === 'fulfilled' ? events.value : { fileDownloads: 0, formRequests: 0 },
      channels: channels.status === 'fulfilled' ? channels.value : [],
      topPages: topPages.status === 'fulfilled' ? topPages.value : [],
      fetchedAt: new Date(),
    };
  }

  /**
   * Fetch all organic insights in parallel.
   */
  async getOrganicInsights(user, propertyId, { startDate, endDate, rowLimit = 10 }) {
    const [landingPages, devices, countries] = await Promise.allSettled([
      this.getOrganicLandingPages(user, propertyId, { startDate, endDate, rowLimit }),
      this.getOrganicByDevice(user, propertyId, { startDate, endDate }),
      this.getOrganicByCountry(user, propertyId, { startDate, endDate, rowLimit }),
    ]);

    return {
      landingPages: landingPages.status === 'fulfilled' ? landingPages.value : [],
      devices: devices.status === 'fulfilled' ? devices.value : [],
      countries: countries.status === 'fulfilled' ? countries.value : [],
      fetchedAt: new Date(),
    };
  }
}

module.exports = new AnalyticsService();
