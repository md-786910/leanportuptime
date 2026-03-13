const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

module.exports = redis;
