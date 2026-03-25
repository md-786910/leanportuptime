const { Worker } = require('bullmq');
const seoService = require('../services/seo.service');
const Site = require('../models/Site');
const SeoAudit = require('../models/SeoAudit');
const Notification = require('../models/Notification');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

function createSeoWorker(connection) {
  const worker = new Worker(
    'seo-checks',
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`SEO audit started: ${url}`);

      // Fetch previous pageSpeed data for cache/carry-forward
      const lastAudit = await SeoAudit.findOne({ siteId })
        .sort({ scannedAt: -1 })
        .select('pageSpeed')
        .lean();

      const result = await seoService.runAudit(url, lastAudit?.pageSpeed || null);

      // Save audit
      await SeoAudit.create({
        siteId,
        ...result,
        scannedAt: new Date(),
      });

      // Update site's embedded seo data
      const site = await Site.findById(siteId).populate('userId', 'email');
      if (!site) return;

      site.seo = {
        lastScannedAt: new Date(),
        score: result.score,
        metaTagsScore: result.metaTagsScore,
        contentScore: result.contentScore,
        linksScore: result.linksScore,
        performanceScore: result.performanceScore,
      };
      await site.save();

      // Send notification if SEO score is critically low
      if (result.score < 40) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await Notification.findOne({
          siteId,
          type: 'seo_audit_alert',
          createdAt: { $gte: today },
        });

        if (!existing) {
          await notificationService.notify(
            site.userId._id,
            site,
            'seo_audit_alert',
            `SEO audit for ${site.name}: Score ${result.score}/100. Review meta tags, content, and performance.`
          );
        }
      }

      logger.debug(`SEO audit completed: ${url} -> Score: ${result.score}`);
      return result;
    },
    { connection, concurrency: 2 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`SEO audit job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createSeoWorker;
