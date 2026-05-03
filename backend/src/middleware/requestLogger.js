/**
 * @fileoverview Request logger middleware with response-time tracking.
 * Logs coloured status codes and elapsed milliseconds for every request.
 * Sets the `X-Response-Time` header on every response for observability.
 *
 * @module middleware/requestLogger
 */

'use strict';

/**
 * Logs each HTTP request with its status code and response time.
 * Also sets the `X-Response-Time` header on every response.
 *
 * @param {import('express').Request}      req  - Express request
 * @param {import('express').Response}     res  - Express response
 * @param {import('express').NextFunction} next - Next middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Intercept res.send to set the header before headers are flushed
  const originalSend = res.send;
  res.send = function(body) {
    if (!res.headersSent) {
      const ms = Date.now() - start;
      res.setHeader('X-Response-Time', `${ms}ms`);
    }
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const ms = Date.now() - start;
    const colour = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m';
    const reset  = '\x1b[0m';
    console.log(`${colour}[${res.statusCode}]${reset} ${req.method} ${req.path} — ${ms}ms`);
  });

  next();
}

module.exports = { requestLogger };
