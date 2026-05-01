const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    interval: {
      type: Number,
      default: 5 * 60 * 1000, // 5 minutes in ms
      min: 60 * 1000,          // 1 minute
      max: 24 * 60 * 60 * 1000, // 24 hours
    },
    paused: {
      type: Boolean,
      default: false,
    },
    currentStatus: {
      type: String,
      enum: ['up', 'down', 'degraded', 'pending'],
      default: 'pending',
    },
    lastCheckedAt: {
      type: Date,
      index: true,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
    ssl: {
      issuer: String,
      validFrom: Date,
      validTo: Date,
      daysRemaining: Number,
      protocol: String,
      cipher: String,
      fingerprint: String,
      lastCheckedAt: Date,
    },
    security: [
      {
        check: String,
        status: { type: String, enum: ['pass', 'fail', 'warn'] },
        message: String,
      },
    ],
    securityScore: {
      type: Number,
      default: 0,
    },
    plugins: {
      lastScannedAt: Date,
      totalPlugins: { type: Number, default: 0 },
      issueCount: { type: Number, default: 0 },
      flaggedPlugins: { type: [String], default: [] },
    },
    siteScan: {
      lastScannedAt: Date,
      score: { type: Number, default: 0 },
      performanceScore: { type: Number, default: 0 },
      bugsScore: { type: Number, default: 0 },
      malwareScore: { type: Number, default: 0 },
    },
    seo: {
      lastScannedAt: Date,
      score: { type: Number, default: 0 },
      metaTagsScore: { type: Number, default: 0 },
      contentScore: { type: Number, default: 0 },
      linksScore: { type: Number, default: 0 },
      performanceScore: { type: Number, default: 0 },
    },
    searchConsole: {
      property: { type: String, default: null },
      connectedAt: { type: Date, default: null },
    },
    analytics: {
      propertyId: { type: String, default: null },
      propertyName: { type: String, default: null },
      connectedAt: { type: Date, default: null },
      filters: {
        excludedCountries: { type: [String], default: [] },
        excludedTopPages: { type: [String], default: [] },
      },
    },
    backlinks: {
      domainRank: { type: Number, default: 0 },
      backlinksCount: { type: Number, default: 0 },
      referringDomains: { type: Number, default: 0 },
      newLinksLast30d: { type: Number, default: 0 },
      lostLinksLast30d: { type: Number, default: 0 },
      // Previous snapshots — drive delta chips in the UI. Null until the first change.
      previousDomainRank: { type: Number, default: null },
      previousBacklinksCount: { type: Number, default: null },
      previousReferringDomains: { type: Number, default: null },
      previousNewLinksLast30d: { type: Number, default: null },
      previousLostLinksLast30d: { type: Number, default: null },
      providerName: { type: String, default: null },
      providerMetric: { type: String, default: null },
      lastFetchedAt: { type: Date, default: null },
      fetchError: { type: String, default: null },
      refreshCountThisMonth: { type: Number, default: 0 },
      monthKey: { type: String, default: null },
      items: [{
        // _id auto-generated so admins can address rows for PATCH/DELETE
        sourceUrl: { type: String },
        targetUrl: { type: String },
        anchor: { type: String },
        doFollow: { type: Boolean },
        firstSeen: { type: Date },
        lastSeen: { type: Date },
        linkType: { type: String },
        domainFromRank: { type: Number },
        source: { type: String, enum: ['api', 'manual'], default: 'api' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        updatedAt: { type: Date, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }],
      // Paid placements / press-release backlinks. Always manually managed —
      // never touched by the provider refresh. No DR / source field.
      paidItems: [{
        sourceUrl: { type: String },
        targetUrl: { type: String },
        anchor: { type: String },
        doFollow: { type: Boolean },
        firstSeen: { type: Date },
        lastSeen: { type: Date },
        linkType: { type: String },
        domainFromRank: { type: Number },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        updatedAt: { type: Date, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }],
      listFetchedAt: { type: Date, default: null },
      listFetchError: { type: String, default: null },
      history: [{
        _id: false,
        monthKey: { type: String },
        newDomains: { type: Number, default: 0 },
        lostDomains: { type: Number, default: 0 },
        newBacklinks: { type: Number, default: 0 },
        lostBacklinks: { type: Number, default: 0 },
        backlinks: { type: Number, default: 0 },
        referringDomains: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
      }],
      historyFetchedAt: { type: Date, default: null },
      historyFetchError: { type: String, default: null },
      // Append-only audit log for both API refreshes and manual admin edits.
      // `kind` discriminates aggregate-stats changes from per-item actions.
      changeLog: [{
        _id: false,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        source: { type: String, enum: ['api', 'manual'], required: true },
        kind: { type: String, enum: ['stats', 'item-added', 'item-updated', 'item-removed'], required: true },
        // Populated for kind === 'stats'
        before: {
          domainRank: { type: Number, default: null },
          backlinksCount: { type: Number, default: null },
          referringDomains: { type: Number, default: null },
          newLinksLast30d: { type: Number, default: null },
          lostLinksLast30d: { type: Number, default: null },
        },
        after: {
          domainRank: { type: Number, default: null },
          backlinksCount: { type: Number, default: null },
          referringDomains: { type: Number, default: null },
          newLinksLast30d: { type: Number, default: null },
          lostLinksLast30d: { type: Number, default: null },
        },
        // Populated for kind === 'item-*'
        itemId: { type: mongoose.Schema.Types.ObjectId, default: null },
        itemSourceUrl: { type: String, default: null },
        itemBefore: { type: mongoose.Schema.Types.Mixed, default: null },
        itemAfter: { type: mongoose.Schema.Types.Mixed, default: null },
      }],
    },
    keywords: {
      items: [{
        _id: false,
        keyword: { type: String, required: true },
        position: { type: Number, default: null },
        previousPosition: { type: Number, default: null },
        url: { type: String, default: null },
        searchVolume: { type: Number, default: null },
        keywordDifficulty: { type: Number, default: null },
        cpc: { type: Number, default: null },
        competition: { type: Number, default: null },
        monthlySearches: [{
          _id: false,
          year: Number,
          month: Number,
          searchVolume: Number,
        }],
        locationCode: { type: Number, default: 2276 },
        languageCode: { type: String, default: 'de' },
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: String, default: null },
        lastCheckedAt: { type: Date, default: null },
        lastCheckError: { type: String, default: null },
        history: [{
          _id: false,
          position: { type: Number, default: null },
          url: { type: String, default: null },
          checkedAt: { type: Date },
          source: { type: String, enum: ['api', 'manual'], default: 'api' },
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        }],
      }],
      providerName: { type: String, default: null },
      lastFetchedAt: { type: Date, default: null },
      fetchError: { type: String, default: null },
      refreshCountThisMonth: { type: Number, default: 0 },
      monthKey: { type: String, default: null },
    },
    notifications: {
      email: { type: Boolean, default: true },
      slack: { type: Boolean, default: false },
      discord: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false },
      slackUrl: String,
      discordUrl: String,
      webhookUrl: String,
    },
    expectedKeywords: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

siteSchema.index({ userId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('Site', siteSchema);
