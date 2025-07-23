const Logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  Logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 400;
    message = 'Invalid URL - domain not found';
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : message,
    message: statusCode === 500 ? 'Something went wrong. Please try again later.' : err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

module.exports = errorHandler;