const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack, url: req.originalUrl });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `${field} already exists`,
      },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID',
      },
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.statusCode ? err.message : 'Internal server error',
    },
  });
};

module.exports = errorHandler;
