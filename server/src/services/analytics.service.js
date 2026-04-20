const { google } = require('googleapis');
const config = require('../config');
const User = require('../models/User');

const ORGANIC_FILTER = {
  filter: {
    fieldName: 'sessionDefaultChannelGroup',
    stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
  },
};

const FORM_EVENT_NAMES = [
  'generate_lead',
  'form_submit',
  'form_start',
  'contact_form',
  'form_submission',
  'contact_form_submit',
  'wpforms_submit',
];

const EVENT_STATUS = {
  TRACKED_WITH_DATA: 'tracked_with_data',
  TRACKED_NO_DATA_IN_RANGE: 'tracked_no_data_in_range',
  NOT_DETECTED: 'not_detected',
};

function buildTrackedEventMetric({ count, detectedEventNames, missingMessage }) {
  const uniqueDetectedEventNames = [...new Set((detectedEventNames || []).filter(Boolean))];

  if (uniqueDetectedEventNames.length > 0) {
    return {
      count,
      status: count > 0 ? EVENT_STATUS.TRACKED_WITH_DATA : EVENT_STATUS.TRACKED_NO_DATA_IN_RANGE,
      detectedEventNames: uniqueDetectedEventNames,
      setupMessage: null,
    };
  }

  return {
    count: 0,
    status: EVENT_STATUS.NOT_DETECTED,
    detectedEventNames: [],
    setupMessage: missingMessage,
  };
}

function emptyWebsiteEvents() {
  return {
    fileDownloads: buildTrackedEventMetric({
      count: 0,
      detectedEventNames: [],
      missingMessage: 'No matching GA4 event detected. Set up GA4\'s standard file_download event to report this metric.',
    }),
    formRequests: buildTrackedEventMetric({
      count: 0,
      detectedEventNames: [],
      missingMessage: `No matching GA4 event detected. Set up a form-submit event such as ${FORM_EVENT_NAMES.join(', ')} to report this metric.`,
    }),
    allEvents: [],
    trackingNotes: [],
  };
}

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
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    const row = data.rows?.[0];
    if (!row) {
      return { sessions: 0, uniqueVisitors: 0, newUsers: 0, pageViews: 0, bounceRate: 0, avgTimeOnPage: 0, fetchedAt: new Date() };
    }

    const vals = row.metricValues.map((v) => parseFloat(v.value) || 0);
    return {
      sessions: vals[0],
      uniqueVisitors: vals[1],
      newUsers: vals[2],
      pageViews: vals[3],
      bounceRate: vals[4],
      avgTimeOnPage: vals[5],
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
    const fetchEvents = async () => {
      const auth = await this._getAuthClient(user);
      const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

      const { data } = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 50,
        },
      });

      let fileDownloads = 0;
      let formRequests = 0;
      const detectedFileDownloadEvents = [];
      const detectedFormEvents = [];
      const allEvents = [];

      for (const row of data.rows || []) {
        const eventName = row.dimensionValues[0].value;
        const count = parseFloat(row.metricValues[0].value) || 0;
        const users = parseFloat(row.metricValues[1]?.value) || 0;

        allEvents.push({ eventName, eventCount: count, totalUsers: users });

        if (eventName === 'file_download') {
          fileDownloads = count;
          detectedFileDownloadEvents.push(eventName);
        }
        if (FORM_EVENT_NAMES.includes(eventName)) {
          formRequests += count;
          detectedFormEvents.push(eventName);
        }
      }

      return {
        fileDownloads: buildTrackedEventMetric({
          count: fileDownloads,
          detectedEventNames: detectedFileDownloadEvents,
          missingMessage: 'No matching GA4 event detected. Set up GA4\'s standard file_download event to report this metric.',
        }),
        formRequests: buildTrackedEventMetric({
          count: formRequests,
          detectedEventNames: detectedFormEvents,
          missingMessage: `No matching GA4 event detected. Set up a form-submit event such as ${FORM_EVENT_NAMES.join(', ')} to report this metric.`,
        }),
        allEvents,
        trackingNotes: [
          'File downloads use GA4\'s standard file_download event.',
          `Form requests recognize these GA4 event names: ${FORM_EVENT_NAMES.join(', ')}.`,
        ],
      };
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
      events: events.status === 'fulfilled' ? events.value : emptyWebsiteEvents(),
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
