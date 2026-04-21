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
    },
    backlinks: {
      domainRank: { type: Number, default: 0 },
      backlinksCount: { type: Number, default: 0 },
      referringDomains: { type: Number, default: 0 },
      newLinksLast30d: { type: Number, default: 0 },
      lostLinksLast30d: { type: Number, default: 0 },
      providerName: { type: String, default: null },
      providerMetric: { type: String, default: null },
      lastFetchedAt: { type: Date, default: null },
      fetchError: { type: String, default: null },
      refreshCountThisMonth: { type: Number, default: 0 },
      monthKey: { type: String, default: null },
      items: [{
        _id: false,
        sourceUrl: { type: String },
        targetUrl: { type: String },
        anchor: { type: String },
        doFollow: { type: Boolean },
        firstSeen: { type: Date },
        lastSeen: { type: Date },
        linkType: { type: String },
        domainFromRank: { type: Number },
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
