const Site = require('../models/Site');
const SeoAudit = require('../models/SeoAudit');
const { seoQueue } = require('../config/queue');

exports.getLatest = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const audit = await SeoAudit.findOne({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

exports.triggerScan = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    await seoQueue.add(
      'seo-check',
      { siteId: site._id.toString(), url: site.url },
      { removeOnComplete: 50, removeOnFail: 20 }
    );

    res.json({ success: true, data: { message: 'SEO audit triggered' } });
  } catch (error) {
    next(error);
  }
};

exports.fetchPageSpeed = async (req, res, next) => {
  try {
    const config = require('../config');

    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    if (!config.pageSpeedApiKey) {
      return res.status(400).json({
        success: false,
        error: { message: 'PAGESPEED_API_KEY not configured on server' },
      });
    }

    const siteUrl = site.url;
    const baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

    const buildUrl = (strategy) => {
      let url = `${baseUrl}?url=${encodeURIComponent(siteUrl)}&strategy=${strategy}`;
      url += '&category=performance&category=accessibility&category=best-practices&category=seo';
      url += `&key=${config.pageSpeedApiKey}`;
      return url;
    };

    const extractData = (data) => {
      if (!data?.lighthouseResult) return null;
      const cats = data.lighthouseResult.categories;
      const audits = data.lighthouseResult.audits || {};
      return {
        performance: Math.round((cats?.performance?.score || 0) * 100),
        accessibility: Math.round((cats?.accessibility?.score || 0) * 100),
        bestPractices: Math.round((cats?.['best-practices']?.score || 0) * 100),
        seo: Math.round((cats?.seo?.score || 0) * 100),
        fcp: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : null,
        lcp: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null,
        tbt: audits['total-blocking-time']?.numericValue != null ? Math.round(audits['total-blocking-time'].numericValue) : null,
        cls: audits['cumulative-layout-shift']?.numericValue ?? null,
        si: audits['speed-index']?.numericValue ? Math.round(audits['speed-index'].numericValue) : null,
        inp: audits['interaction-to-next-paint']?.numericValue ? Math.round(audits['interaction-to-next-paint'].numericValue) : null,
        fid: audits['max-potential-fid']?.numericValue ? Math.round(audits['max-potential-fid'].numericValue) : null,
        ttfb: audits['server-response-time']?.numericValue ? Math.round(audits['server-response-time'].numericValue) : null,
      };
    };

    const [mobileRes, desktopRes] = await Promise.allSettled([
      fetch(buildUrl('mobile'), { signal: AbortSignal.timeout(60000) })
        .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(`${r.status}: ${t.slice(0, 200)}`))))),
      fetch(buildUrl('desktop'), { signal: AbortSignal.timeout(60000) })
        .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(`${r.status}: ${t.slice(0, 200)}`))))),
    ]);

    const mobile = mobileRes.status === 'fulfilled' ? extractData(mobileRes.value) : null;
    const desktop = desktopRes.status === 'fulfilled' ? extractData(desktopRes.value) : null;

    if (!mobile && !desktop) {
      const errors = [
        mobileRes.status === 'rejected' ? `mobile: ${mobileRes.reason.message}` : null,
        desktopRes.status === 'rejected' ? `desktop: ${desktopRes.reason.message}` : null,
      ].filter(Boolean).join('; ');
      return res.status(502).json({
        success: false,
        error: { message: `PageSpeed API failed — ${errors || 'no data returned'}` },
      });
    }

    const pageSpeed = { mobile, desktop, fetchedAt: new Date() };
    const lhPerf = mobile?.performance ?? desktop?.performance;

    const audit = await SeoAudit.findOneAndUpdate(
      { siteId: site._id },
      { $set: { pageSpeed, pageSpeedError: null, ...(lhPerf != null && { performanceScore: lhPerf }) } },
      { sort: { scannedAt: -1 }, new: true }
    ).lean();

    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

    const audits = await SeoAudit.find({ siteId: site._id })
      .sort({ scannedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: audits });
  } catch (error) {
    next(error);
  }
};
