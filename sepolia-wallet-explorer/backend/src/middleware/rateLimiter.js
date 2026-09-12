/**
 * In-memory sliding window rate limiter middleware.
 * Restricts the number of requests a single client IP can make within a specified time window.
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // default 1 minute
  const maxRequests = options.max || 30; // default 30 requests per minute
  const message = options.message || 'Too many requests from this IP, please try again later.';

  const ipRequests = new Map();

  return (req, res, next) => {
    // Determine client IP
    const clientIp = 
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const now = Date.now();
    const timestamps = ipRequests.get(clientIp) || [];

    // Filter out timestamps older than the sliding window
    const validTimestamps = timestamps.filter(time => now - time < windowMs);

    if (validTimestamps.length >= maxRequests) {
      const oldestTimestamp = validTimestamps[0];
      const retryAfterSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldestTimestamp + windowMs) / 1000));

      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds
      });
    }

    // Record this request
    validTimestamps.push(now);
    ipRequests.set(clientIp, validTimestamps);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validTimestamps.length);

    // Periodic memory cleanup when map grows
    if (ipRequests.size > 2000) {
      for (const [ip, times] of ipRequests.entries()) {
        const remaining = times.filter(time => now - time < windowMs);
        if (remaining.length === 0) {
          ipRequests.delete(ip);
        } else {
          ipRequests.set(ip, remaining);
        }
      }
    }

    next();
  };
};

module.exports = {
  createRateLimiter
};
