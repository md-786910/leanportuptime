const mongoose = require('mongoose');
const config = require('../config');
const { connection } = require('../config/queue');
const connectDB = require('../config/database');
const createUptimeWorker = require('./uptime.worker');
const createSSLWorker = require('./ssl.worker');
const createSecurityWorker = require('./security.worker');
const createPluginWorker = require('./plugin.worker');
const createSiteScanWorker = require('./sitescan.worker');
const createSeoWorker = require('./seo.worker');
const logger = require('../utils/logger');

// Register all Mongoose models so populate() works
require('../models/User');
require('../models/Site');
require('../models/Check');
require('../models/SSLCert');
require('../models/SecurityAudit');
require('../models/Notification');
require('../models/PluginAudit');
require('../models/SiteScan');
require('../models/SeoAudit');

async function startWorkers() {
  await connectDB();

  const uptimeWorker = createUptimeWorker(connection);
  const sslWorker = createSSLWorker(connection);
  const securityWorker = createSecurityWorker(connection);
  const pluginWorker = createPluginWorker(connection);
  const siteScanWorker = createSiteScanWorker(connection);
  const seoWorker = createSeoWorker(connection);

  logger.info('All workers started');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await uptimeWorker.close();
    await sslWorker.close();
    await securityWorker.close();
    await pluginWorker.close();
    await siteScanWorker.close();
    await seoWorker.close();
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorkers().catch((err) => {
  logger.error(`Worker startup failed: ${err.message}`);
  process.exit(1);
});
