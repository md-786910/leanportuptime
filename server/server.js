const app = require('./src/app');
const config = require('./src/config');
const connectDB = require('./src/config/database');
const schedulerService = require('./src/services/scheduler.service');
const logger = require('./src/utils/logger');

const start = async () => {
  await connectDB();

  schedulerService.start();

  app.listen(config.port, () => {
    logger.info(`WP Sentinel API running on port ${config.port} [${config.env}]`);
  });
};

start().catch((err) => {
  logger.error(`Server startup failed: ${err.message}`);
  process.exit(1);
});
