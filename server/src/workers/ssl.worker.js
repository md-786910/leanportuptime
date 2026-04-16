const { Worker } = require("bullmq");
const sslService = require("../services/ssl.service");
const Site = require("../models/Site");
const SSLCert = require("../models/SSLCert");
const Notification = require("../models/Notification");
const notificationService = require("../services/notification.service");
const logger = require("../utils/logger");

const EXPIRY_THRESHOLDS = [30, 14, 7, 2, 2, 1];

async function shouldNotify(siteId, daysRemaining) {
  // Find the matching threshold
  const threshold = EXPIRY_THRESHOLDS.find((t) => daysRemaining <= t);
  if (!threshold && daysRemaining > 0) return false;

  // Check if we already notified for this threshold today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await Notification.findOne({
    siteId,
    type: "ssl_expiry",
    createdAt: { $gte: today },
  });

  return !existing;
}

function createSSLWorker(connection) {
  const worker = new Worker(
    "ssl-checks",
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`SSL check started: ${url}`);

      const result = await sslService.checkCertificate(url);

      // Save SSL cert history
      await SSLCert.create({ siteId, ...result });

      // Update site's embedded SSL data
      const site = await Site.findById(siteId).populate("userId", "email");
      if (!site) return;

      site.ssl = {
        issuer: result.issuer,
        validFrom: result.validFrom,
        validTo: result.validTo,
        daysRemaining: result.daysRemaining,
        protocol: result.protocol,
        cipher: result.cipher,
        fingerprint: result.fingerprint,
        lastCheckedAt: new Date(),
      };
      await site.save();

      // SSL expiry notifications
      if (result.daysRemaining !== undefined) {
        if (result.daysRemaining <= 0) {
          // Certificate expired — always notify
          const canNotify = await shouldNotify(siteId, 0);
          if (canNotify) {
            await notificationService.notify(
              site.userId._id,
              site,
              "ssl_expiry",
              `⚠️ SSL certificate for ${site.name} has EXPIRED! Immediate action required.`,
            );
            logger.warn(`SSL EXPIRED: ${site.name} (${url})`);
          }
        } else if (result.daysRemaining <= 30) {
          // Certificate expiring soon — notify at 30, 14, 7, 1 day thresholds
          const canNotify = await shouldNotify(siteId, result.daysRemaining);
          if (canNotify) {
            const urgency =
              result.daysRemaining <= 7 ? "🔴 URGENT" : "⚠️ Warning";
            await notificationService.notify(
              site.userId._id,
              site,
              "ssl_expiry",
              `${urgency}: SSL certificate for ${site.name} expires in ${result.daysRemaining} days`,
            );
          }
        }
      }

      logger.debug(
        `SSL check completed: ${url} — ${result.daysRemaining} days remaining`,
      );
      return result;
    },
    { connection, concurrency: 5 },
  );

  worker.on("failed", (job, err) => {
    logger.error(`SSL job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createSSLWorker;
