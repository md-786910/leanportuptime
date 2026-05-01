const mongoose = require('mongoose');
const Site = require('../models/Site');
const AppSettings = require('../models/AppSettings');
const backlinksService = require('../services/backlinks/backlinks.service');

const CHANGELOG_MAX_ENTRIES = 50;
const STATS_FIELDS = [
  'domainRank',
  'backlinksCount',
  'referringDomains',
  'newLinksLast30d',
  'lostLinksLast30d',
];
const PREVIOUS_FIELD_BY_STAT = {
  domainRank: 'previousDomainRank',
  backlinksCount: 'previousBacklinksCount',
  referringDomains: 'previousReferringDomains',
  newLinksLast30d: 'previousNewLinksLast30d',
  lostLinksLast30d: 'previousLostLinksLast30d',
};

function buildQuotaInfo(site, limit, currentMonthKey) {
  const used = site.backlinks?.monthKey === currentMonthKey
    ? (site.backlinks.refreshCountThisMonth || 0)
    : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    monthKey: currentMonthKey,
  };
}

function snapshotStats(bl) {
  return STATS_FIELDS.reduce((acc, k) => {
    acc[k] = bl?.[k] ?? null;
    return acc;
  }, {});
}

function statsEqual(a, b) {
  return STATS_FIELDS.every((k) => (a?.[k] ?? null) === (b?.[k] ?? null));
}

function serializeBacklinks(bl) {
  return {
    domainRank: bl.domainRank || 0,
    backlinksCount: bl.backlinksCount || 0,
    referringDomains: bl.referringDomains || 0,
    newLinksLast30d: bl.newLinksLast30d || 0,
    lostLinksLast30d: bl.lostLinksLast30d || 0,
    previousDomainRank: bl.previousDomainRank ?? null,
    previousBacklinksCount: bl.previousBacklinksCount ?? null,
    previousReferringDomains: bl.previousReferringDomains ?? null,
    previousNewLinksLast30d: bl.previousNewLinksLast30d ?? null,
    previousLostLinksLast30d: bl.previousLostLinksLast30d ?? null,
    providerName: bl.providerName || null,
    providerMetric: bl.providerMetric || null,
    lastFetchedAt: bl.lastFetchedAt || null,
    fetchError: bl.fetchError || null,
    items: (bl.items || []).map(serializeItem),
    paidItems: (bl.paidItems || []).map(serializePaidItem),
    listFetchedAt: bl.listFetchedAt || null,
    listFetchError: bl.listFetchError || null,
    history: bl.history || [],
    historyFetchedAt: bl.historyFetchedAt || null,
    historyFetchError: bl.historyFetchError || null,
  };
}

function serializeItem(it) {
  const o = typeof it.toObject === 'function' ? it.toObject() : { ...it };
  return {
    _id: o._id ? String(o._id) : undefined,
    sourceUrl: o.sourceUrl || null,
    targetUrl: o.targetUrl || null,
    anchor: o.anchor || null,
    doFollow: typeof o.doFollow === 'boolean' ? o.doFollow : null,
    firstSeen: o.firstSeen || null,
    lastSeen: o.lastSeen || null,
    linkType: o.linkType || null,
    domainFromRank: typeof o.domainFromRank === 'number' ? o.domainFromRank : null,
    source: o.source || 'api',
    addedBy: o.addedBy ? String(o.addedBy) : null,
    updatedAt: o.updatedAt || null,
    updatedBy: o.updatedBy ? String(o.updatedBy) : null,
  };
}

function serializePaidItem(it) {
  const o = typeof it.toObject === 'function' ? it.toObject() : { ...it };
  return {
    _id: o._id ? String(o._id) : undefined,
    sourceUrl: o.sourceUrl || null,
    targetUrl: o.targetUrl || null,
    anchor: o.anchor || null,
    doFollow: typeof o.doFollow === 'boolean' ? o.doFollow : null,
    firstSeen: o.firstSeen || null,
    lastSeen: o.lastSeen || null,
    linkType: o.linkType || null,
    domainFromRank: typeof o.domainFromRank === 'number' ? o.domainFromRank : null,
    addedBy: o.addedBy ? String(o.addedBy) : null,
    updatedAt: o.updatedAt || null,
    updatedBy: o.updatedBy ? String(o.updatedBy) : null,
  };
}

function pushChangeLog(bl, entry) {
  if (!Array.isArray(bl.changeLog)) bl.changeLog = [];
  bl.changeLog.push(entry);
  if (bl.changeLog.length > CHANGELOG_MAX_ENTRIES) {
    bl.changeLog.splice(0, bl.changeLog.length - CHANGELOG_MAX_ENTRIES);
  }
}

// Merge an incoming API items array into the existing items array, preserving
// manually-added/edited rows (matched case-insensitively by sourceUrl).
function mergeItems(existing, incoming) {
  const existingList = (existing || []).map((it) => (typeof it.toObject === 'function' ? it.toObject() : it));
  const incomingList = incoming || [];

  const manualByUrl = new Map();
  for (const it of existingList) {
    if (it.source === 'manual' && it.sourceUrl) {
      manualByUrl.set(it.sourceUrl.toLowerCase(), it);
    }
  }

  const seenManualKeys = new Set();
  const merged = [];

  for (const api of incomingList) {
    const key = (api.sourceUrl || '').toLowerCase();
    const manualMatch = manualByUrl.get(key);
    if (manualMatch) {
      // Refresh scraped fields on the manual row but keep its provenance metadata.
      merged.push({
        ...manualMatch,
        targetUrl: api.targetUrl ?? manualMatch.targetUrl,
        anchor: api.anchor ?? manualMatch.anchor,
        doFollow: typeof api.doFollow === 'boolean' ? api.doFollow : manualMatch.doFollow,
        linkType: api.linkType ?? manualMatch.linkType,
        firstSeen: api.firstSeen ?? manualMatch.firstSeen,
        lastSeen: api.lastSeen ?? manualMatch.lastSeen,
        domainFromRank: typeof api.domainFromRank === 'number' ? api.domainFromRank : manualMatch.domainFromRank,
      });
      seenManualKeys.add(key);
    } else {
      merged.push({ ...api, source: 'api' });
    }
  }

  // Preserve manual rows that didn't match any incoming API row.
  for (const [key, manualRow] of manualByUrl.entries()) {
    if (!seenManualKeys.has(key)) merged.push(manualRow);
  }

  return merged;
}

// One-time backfill: items saved under the old (`_id: false`) schema lack an
// _id. Assign fresh ObjectIds so subsequent PATCH/DELETE by id succeed. Called
// from getStatus so the transition is transparent on first admin load.
async function backfillLegacyItemIds(site) {
  const items = site?.backlinks?.items;
  if (!Array.isArray(items) || items.length === 0) return false;
  let mutated = false;
  for (const it of items) {
    if (!it._id) {
      it._id = new mongoose.Types.ObjectId();
      mutated = true;
    }
  }
  if (mutated) {
    site.markModified('backlinks.items');
    await site.save();
  }
  return mutated;
}

exports.getStatus = async (req, res, next) => {
  try {
    const site = req.site;
    await backfillLegacyItemIds(site);
    const settings = await AppSettings.getSingleton();
    const currentMonthKey = backlinksService.currentMonthKey();

    const bl = site.backlinks || {};
    const lastFetchedAt = bl.lastFetchedAt || null;

    res.json({
      success: true,
      data: {
        backlinks: serializeBacklinks(bl),
        isStale: backlinksService.isStale(lastFetchedAt),
        hasData: !!lastFetchedAt,
        quota: buildQuotaInfo(site, settings.backlinksMonthlyLimit, currentMonthKey),
        providerInfo: backlinksService.getProviderInfo(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const site = req.site;
    const settings = await AppSettings.getSingleton();
    const limit = settings.backlinksMonthlyLimit;
    const currentMonthKey = backlinksService.currentMonthKey();

    // Reset counter if month changed
    const currentCount = site.backlinks?.monthKey === currentMonthKey
      ? (site.backlinks.refreshCountThisMonth || 0)
      : 0;

    // Quota check
    if (currentCount >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Monthly refresh limit reached (${currentCount}/${limit}). Increase in settings to allow more refreshes.`,
          used: currentCount,
          limit,
        },
      });
    }

    // Check provider is configured
    const providerInfo = backlinksService.getProviderInfo();
    if (!providerInfo.configured) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: `Backlinks provider '${providerInfo.name}' is not configured. Check server environment variables.`,
        },
      });
    }

    // Fetch from provider
    let summary;
    try {
      summary = await backlinksService.fetchSummary(site.url);
    } catch (err) {
      await Site.findByIdAndUpdate(site._id, {
        'backlinks.fetchError': err.message,
      });
      const status = err.statusCode || 502;
      return res.status(status).json({
        success: false,
        error: {
          code: err.code || 'FETCH_FAILED',
          message: err.message,
        },
      });
    }

    // Partial-failure-allowed sub-fetches.
    let listItems = null;
    let listFetchError = null;
    try {
      const list = await backlinksService.fetchBacklinksList(site.url, { limit: 100 });
      listItems = list.items;
    } catch (err) {
      console.warn('[Backlinks] List fetch failed (summary committed):', err.message);
      listFetchError = err.message;
    }

    let historyItems = null;
    let historyFetchError = null;
    try {
      const hist = await backlinksService.fetchHistory(site.url, { months: 24 });
      historyItems = hist.history;
    } catch (err) {
      console.warn('[Backlinks] History fetch failed (summary committed):', err.message);
      historyFetchError = err.message;
    }

    // Apply to the loaded doc so we can mutate sub-arrays (changeLog, items) cleanly.
    const now = new Date();
    if (!site.backlinks) site.backlinks = {};
    const bl = site.backlinks;

    const before = snapshotStats(bl);
    const after = {
      domainRank: summary.domainRank,
      backlinksCount: summary.backlinksCount,
      referringDomains: summary.referringDomains,
      newLinksLast30d: summary.newLinksLast30d,
      lostLinksLast30d: summary.lostLinksLast30d,
    };

    if (!statsEqual(before, after)) {
      for (const k of STATS_FIELDS) bl[PREVIOUS_FIELD_BY_STAT[k]] = before[k];
      pushChangeLog(bl, {
        changedAt: now,
        changedBy: null,
        source: 'api',
        kind: 'stats',
        before,
        after,
      });
    }

    for (const k of STATS_FIELDS) bl[k] = after[k];
    bl.providerName = summary.providerName;
    bl.providerMetric = summary.providerMetric;
    bl.lastFetchedAt = now;
    bl.fetchError = null;
    bl.refreshCountThisMonth = currentCount + 1;
    bl.monthKey = currentMonthKey;

    if (listItems) {
      bl.items = mergeItems(bl.items, listItems);
      bl.listFetchedAt = now;
      bl.listFetchError = null;
    } else {
      bl.listFetchError = listFetchError;
    }

    if (historyItems) {
      bl.history = historyItems;
      bl.historyFetchedAt = now;
      bl.historyFetchError = null;
    } else {
      bl.historyFetchError = historyFetchError;
    }

    site.markModified('backlinks');
    await site.save();

    res.json({
      success: true,
      data: {
        backlinks: serializeBacklinks(bl),
        isStale: false,
        hasData: true,
        quota: {
          used: bl.refreshCountThisMonth,
          limit,
          remaining: Math.max(0, limit - bl.refreshCountThisMonth),
          monthKey: currentMonthKey,
        },
        providerInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /manual — admin-only override of aggregate DA stats.
exports.manualOverride = async (req, res, next) => {
  try {
    const site = req.site;
    if (!site.backlinks) site.backlinks = {};
    const bl = site.backlinks;

    const body = req.body || {};
    const { effectiveDate, ...statsBody } = body;

    const updates = {};
    for (const k of STATS_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(statsBody, k)) {
        const v = statsBody[k];
        if (v === null || v === '') {
          updates[k] = null;
        } else {
          const n = Number(v);
          if (!Number.isFinite(n)) {
            return res.status(400).json({
              success: false,
              error: { code: 'INVALID_VALUE', message: `Field "${k}" must be a number` },
            });
          }
          updates[k] = n;
        }
      }
    }

    const disallowed = Object.keys(statsBody).filter((k) => !STATS_FIELDS.includes(k));
    if (disallowed.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_FIELDS', message: `Unsupported fields: ${disallowed.join(', ')}` },
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_PAYLOAD', message: 'Provide at least one field to update' },
      });
    }

    // Determine effective date and the corresponding history bucket.
    const currentMonthKey = backlinksService.currentMonthKey();
    let effective = null;
    if (effectiveDate) {
      effective = new Date(effectiveDate);
      if (Number.isNaN(effective.getTime())) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATE', message: 'effectiveDate must be a valid date' },
        });
      }
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (effective.getTime() > todayEnd.getTime()) {
        return res.status(400).json({
          success: false,
          error: { code: 'FUTURE_DATE', message: 'effectiveDate cannot be in the future' },
        });
      }
    }
    const effectiveMonthKey = effective
      ? `${effective.getFullYear()}-${String(effective.getMonth() + 1).padStart(2, '0')}`
      : currentMonthKey;
    const isBackfill = effectiveMonthKey !== currentMonthKey;

    const before = snapshotStats(bl);
    const after = { ...before, ...updates };

    if (isBackfill) {
      // Past month → only upsert the history bucket for that month, do NOT touch live stats.
      if (!Array.isArray(bl.history)) bl.history = [];
      let bucket = bl.history.find((h) => h.monthKey === effectiveMonthKey);
      const beforeBucket = bucket ? { ...(typeof bucket.toObject === 'function' ? bucket.toObject() : bucket) } : null;
      if (!bucket) {
        bucket = {
          monthKey: effectiveMonthKey,
          newDomains: 0,
          lostDomains: 0,
          newBacklinks: 0,
          lostBacklinks: 0,
          backlinks: 0,
          referringDomains: 0,
          rank: 0,
        };
        bl.history.push(bucket);
        bucket = bl.history[bl.history.length - 1];
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'domainRank')) bucket.rank = updates.domainRank ?? 0;
      if (Object.prototype.hasOwnProperty.call(updates, 'backlinksCount')) bucket.backlinks = updates.backlinksCount ?? 0;
      if (Object.prototype.hasOwnProperty.call(updates, 'referringDomains')) bucket.referringDomains = updates.referringDomains ?? 0;
      if (Object.prototype.hasOwnProperty.call(updates, 'newLinksLast30d')) bucket.newBacklinks = updates.newLinksLast30d ?? 0;
      if (Object.prototype.hasOwnProperty.call(updates, 'lostLinksLast30d')) bucket.lostBacklinks = updates.lostLinksLast30d ?? 0;

      // Audit trail: log a stats entry timestamped at the effective date with the bucket's before/after
      // expressed in the same shape as live stats (so the changelog UI keeps working uniformly).
      const bucketBeforeAsStats = beforeBucket ? {
        domainRank: beforeBucket.rank ?? null,
        backlinksCount: beforeBucket.backlinks ?? null,
        referringDomains: beforeBucket.referringDomains ?? null,
        newLinksLast30d: beforeBucket.newBacklinks ?? null,
        lostLinksLast30d: beforeBucket.lostBacklinks ?? null,
      } : { domainRank: null, backlinksCount: null, referringDomains: null, newLinksLast30d: null, lostLinksLast30d: null };
      const bucketAfterAsStats = {
        domainRank: bucket.rank ?? null,
        backlinksCount: bucket.backlinks ?? null,
        referringDomains: bucket.referringDomains ?? null,
        newLinksLast30d: bucket.newBacklinks ?? null,
        lostLinksLast30d: bucket.lostBacklinks ?? null,
      };
      pushChangeLog(bl, {
        changedAt: effective,
        changedBy: req.user?._id || null,
        source: 'manual',
        kind: 'stats',
        before: bucketBeforeAsStats,
        after: bucketAfterAsStats,
      });
    } else {
      // Current month → existing behavior plus mirror into this month's history bucket.
      if (!statsEqual(before, after)) {
        for (const k of Object.keys(updates)) bl[PREVIOUS_FIELD_BY_STAT[k]] = before[k];
        pushChangeLog(bl, {
          changedAt: effective || new Date(),
          changedBy: req.user?._id || null,
          source: 'manual',
          kind: 'stats',
          before,
          after,
        });
      }
      for (const k of Object.keys(updates)) bl[k] = updates[k];

      // Mirror to history[currentMonthKey] so period charts see today's manual edits.
      if (!Array.isArray(bl.history)) bl.history = [];
      let bucket = bl.history.find((h) => h.monthKey === currentMonthKey);
      if (!bucket) {
        bucket = {
          monthKey: currentMonthKey,
          newDomains: 0,
          lostDomains: 0,
          newBacklinks: 0,
          lostBacklinks: 0,
          backlinks: 0,
          referringDomains: 0,
          rank: 0,
        };
        bl.history.push(bucket);
        bucket = bl.history[bl.history.length - 1];
      }
      bucket.rank = after.domainRank ?? 0;
      bucket.backlinks = after.backlinksCount ?? 0;
      bucket.referringDomains = after.referringDomains ?? 0;
      bucket.newBacklinks = after.newLinksLast30d ?? 0;
      bucket.lostBacklinks = after.lostLinksLast30d ?? 0;
    }

    site.markModified('backlinks');
    await site.save();

    res.json({
      success: true,
      data: {
        backlinks: serializeBacklinks(bl),
        isStale: backlinksService.isStale(bl.lastFetchedAt),
        hasData: !!bl.lastFetchedAt,
        quota: buildQuotaInfo(site, (await AppSettings.getSingleton()).backlinksMonthlyLimit, backlinksService.currentMonthKey()),
        providerInfo: backlinksService.getProviderInfo(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getChangelog = async (req, res, next) => {
  try {
    const site = await Site.findById(req.site._id).populate('backlinks.changeLog.changedBy', 'email').lean();
    const entries = (site?.backlinks?.changeLog || []).slice().reverse();
    res.json({ success: true, data: { entries } });
  } catch (error) {
    next(error);
  }
};

// POST /items — add a manual backlink row.
exports.addItem = async (req, res, next) => {
  try {
    const site = req.site;
    if (!site.backlinks) site.backlinks = {};
    const bl = site.backlinks;
    if (!Array.isArray(bl.items)) bl.items = [];

    const { sourceUrl, targetUrl, anchor, doFollow, linkType, firstSeen, lastSeen, domainFromRank } = req.body || {};
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'SOURCE_URL_REQUIRED', message: 'sourceUrl is required' } });
    }

    const normalized = sourceUrl.trim();
    const dup = bl.items.find((it) => (it.sourceUrl || '').toLowerCase() === normalized.toLowerCase());
    if (dup) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_SOURCE_URL', message: 'A backlink with this sourceUrl already exists' } });
    }

    const now = new Date();
    const newItem = {
      sourceUrl: normalized,
      targetUrl: targetUrl || null,
      anchor: anchor || null,
      doFollow: typeof doFollow === 'boolean' ? doFollow : undefined,
      linkType: linkType || null,
      firstSeen: firstSeen ? new Date(firstSeen) : null,
      lastSeen: lastSeen ? new Date(lastSeen) : null,
      domainFromRank: typeof domainFromRank === 'number' ? domainFromRank : (domainFromRank ? Number(domainFromRank) : undefined),
      source: 'manual',
      addedBy: req.user?._id || null,
      updatedAt: null,
      updatedBy: null,
    };

    bl.items.push(newItem);
    const created = bl.items[bl.items.length - 1];

    pushChangeLog(bl, {
      changedAt: now,
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-added',
      itemId: created._id,
      itemSourceUrl: created.sourceUrl,
      itemBefore: null,
      itemAfter: created.toObject ? created.toObject() : { ...created },
    });

    site.markModified('backlinks');
    await site.save();

    res.status(201).json({ success: true, data: { item: serializeItem(created) } });
  } catch (error) {
    next(error);
  }
};

const ITEM_EDITABLE_FIELDS = ['sourceUrl', 'targetUrl', 'anchor', 'doFollow', 'linkType', 'firstSeen', 'lastSeen', 'domainFromRank'];

exports.updateItem = async (req, res, next) => {
  try {
    const site = req.site;
    const { itemId } = req.params;
    const bl = site.backlinks || {};
    const item = Array.isArray(bl.items) ? bl.items.id?.(itemId) : null;
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Backlink item not found' } });
    }

    const before = item.toObject ? item.toObject() : { ...item };
    const body = req.body || {};
    const disallowed = Object.keys(body).filter((k) => !ITEM_EDITABLE_FIELDS.includes(k));
    if (disallowed.length) {
      return res.status(400).json({ success: false, error: { code: 'UNKNOWN_FIELDS', message: `Unsupported fields: ${disallowed.join(', ')}` } });
    }

    for (const k of ITEM_EDITABLE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(body, k)) continue;
      const v = body[k];
      if (k === 'doFollow') {
        item.doFollow = typeof v === 'boolean' ? v : (v === 'true' || v === 1);
      } else if (k === 'firstSeen' || k === 'lastSeen') {
        item[k] = v ? new Date(v) : null;
      } else if (k === 'domainFromRank') {
        if (v === null || v === '') item.domainFromRank = undefined;
        else {
          const n = Number(v);
          if (!Number.isFinite(n)) return res.status(400).json({ success: false, error: { code: 'INVALID_VALUE', message: 'domainFromRank must be a number' } });
          item.domainFromRank = n;
        }
      } else {
        item[k] = v == null ? null : String(v);
      }
    }

    item.source = 'manual';
    item.updatedAt = new Date();
    item.updatedBy = req.user?._id || null;

    pushChangeLog(bl, {
      changedAt: item.updatedAt,
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-updated',
      itemId: item._id,
      itemSourceUrl: item.sourceUrl,
      itemBefore: before,
      itemAfter: item.toObject ? item.toObject() : { ...item },
    });

    site.markModified('backlinks');
    await site.save();

    res.json({ success: true, data: { item: serializeItem(item) } });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const site = req.site;
    const { itemId } = req.params;
    const bl = site.backlinks || {};
    const item = Array.isArray(bl.items) ? bl.items.id?.(itemId) : null;
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Backlink item not found' } });
    }

    const snapshot = item.toObject ? item.toObject() : { ...item };

    if (typeof item.deleteOne === 'function') item.deleteOne();
    else bl.items.pull({ _id: itemId });

    pushChangeLog(bl, {
      changedAt: new Date(),
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-removed',
      itemId: snapshot._id,
      itemSourceUrl: snapshot.sourceUrl,
      itemBefore: snapshot,
      itemAfter: null,
    });

    site.markModified('backlinks');
    await site.save();

    res.json({ success: true, data: { removed: String(snapshot._id) } });
  } catch (error) {
    next(error);
  }
};

// ===== Paid backlinks (manual-only) =====

const PAID_EDITABLE_FIELDS = ['sourceUrl', 'targetUrl', 'anchor', 'doFollow', 'linkType', 'firstSeen', 'lastSeen', 'domainFromRank'];

exports.addPaidItem = async (req, res, next) => {
  try {
    const site = req.site;
    if (!site.backlinks) site.backlinks = {};
    const bl = site.backlinks;
    if (!Array.isArray(bl.paidItems)) bl.paidItems = [];

    const { sourceUrl, targetUrl, anchor, doFollow, linkType, firstSeen, lastSeen, domainFromRank } = req.body || {};
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'SOURCE_URL_REQUIRED', message: 'sourceUrl is required' } });
    }

    const normalized = sourceUrl.trim();
    const dup = bl.paidItems.find((it) => (it.sourceUrl || '').toLowerCase() === normalized.toLowerCase());
    if (dup) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_SOURCE_URL', message: 'A paid backlink with this sourceUrl already exists' } });
    }

    let parsedDomainFromRank;
    if (domainFromRank != null && domainFromRank !== '') {
      parsedDomainFromRank = Number(domainFromRank);
      if (!Number.isFinite(parsedDomainFromRank)) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_VALUE', message: 'domainFromRank must be a number' } });
      }
    }

    const now = new Date();
    const newItem = {
      sourceUrl: normalized,
      targetUrl: targetUrl || null,
      anchor: anchor || null,
      doFollow: typeof doFollow === 'boolean' ? doFollow : undefined,
      linkType: linkType || null,
      firstSeen: firstSeen ? new Date(firstSeen) : null,
      lastSeen: lastSeen ? new Date(lastSeen) : null,
      domainFromRank: parsedDomainFromRank,
      addedBy: req.user?._id || null,
      updatedAt: null,
      updatedBy: null,
    };

    bl.paidItems.push(newItem);
    const created = bl.paidItems[bl.paidItems.length - 1];

    pushChangeLog(bl, {
      changedAt: now,
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-added',
      itemId: created._id,
      itemSourceUrl: created.sourceUrl,
      itemBefore: null,
      itemAfter: created.toObject ? created.toObject() : { ...created },
    });

    site.markModified('backlinks');
    await site.save();

    res.status(201).json({ success: true, data: { item: serializePaidItem(created) } });
  } catch (error) {
    next(error);
  }
};

exports.updatePaidItem = async (req, res, next) => {
  try {
    const site = req.site;
    const { itemId } = req.params;
    const bl = site.backlinks || {};
    const item = Array.isArray(bl.paidItems) ? bl.paidItems.id?.(itemId) : null;
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Paid backlink not found' } });
    }

    const before = item.toObject ? item.toObject() : { ...item };
    const body = req.body || {};
    const disallowed = Object.keys(body).filter((k) => !PAID_EDITABLE_FIELDS.includes(k));
    if (disallowed.length) {
      return res.status(400).json({ success: false, error: { code: 'UNKNOWN_FIELDS', message: `Unsupported fields: ${disallowed.join(', ')}` } });
    }

    for (const k of PAID_EDITABLE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(body, k)) continue;
      const v = body[k];
      if (k === 'doFollow') {
        item.doFollow = typeof v === 'boolean' ? v : (v === 'true' || v === 1);
      } else if (k === 'firstSeen' || k === 'lastSeen') {
        item[k] = v ? new Date(v) : null;
      } else if (k === 'domainFromRank') {
        if (v === null || v === '') item.domainFromRank = undefined;
        else {
          const n = Number(v);
          if (!Number.isFinite(n)) return res.status(400).json({ success: false, error: { code: 'INVALID_VALUE', message: 'domainFromRank must be a number' } });
          item.domainFromRank = n;
        }
      } else {
        item[k] = v == null ? null : String(v);
      }
    }

    item.updatedAt = new Date();
    item.updatedBy = req.user?._id || null;

    pushChangeLog(bl, {
      changedAt: item.updatedAt,
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-updated',
      itemId: item._id,
      itemSourceUrl: item.sourceUrl,
      itemBefore: before,
      itemAfter: item.toObject ? item.toObject() : { ...item },
    });

    site.markModified('backlinks');
    await site.save();

    res.json({ success: true, data: { item: serializePaidItem(item) } });
  } catch (error) {
    next(error);
  }
};

exports.removePaidItem = async (req, res, next) => {
  try {
    const site = req.site;
    const { itemId } = req.params;
    const bl = site.backlinks || {};
    const item = Array.isArray(bl.paidItems) ? bl.paidItems.id?.(itemId) : null;
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Paid backlink not found' } });
    }

    const snapshot = item.toObject ? item.toObject() : { ...item };

    if (typeof item.deleteOne === 'function') item.deleteOne();
    else bl.paidItems.pull({ _id: itemId });

    pushChangeLog(bl, {
      changedAt: new Date(),
      changedBy: req.user?._id || null,
      source: 'manual',
      kind: 'item-removed',
      itemId: snapshot._id,
      itemSourceUrl: snapshot.sourceUrl,
      itemBefore: snapshot,
      itemAfter: null,
    });

    site.markModified('backlinks');
    await site.save();

    res.json({ success: true, data: { removed: String(snapshot._id) } });
  } catch (error) {
    next(error);
  }
};
