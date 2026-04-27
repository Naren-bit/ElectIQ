/**
 * @fileoverview Global error handler middleware.
 * Returns structured JSON error responses with optional stack traces
 * in non-production environments.
 *
 * @module middleware/errorHandler
 */

'use strict';

/**
 * Express error-handling middleware.
 *
 * @param {Error}                       err  - The thrown or forwarded error
 * @param {import('express').Request}   req  - Express request
 * @param {import('express').Response}  res  - Express response
 * @param {import('express').NextFunction} _next - Next middleware (unused but required by Express)
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
