import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for different route groups.
 *
 * AI routes are the most expensive (external API calls), so they get
 * a tighter per-user budget. Auth routes get a separate limiter to
 * prevent brute-force attacks.
 */

/** General API limiter — 100 requests per 15 minutes per IP */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

/** AI route limiter — 30 requests per minute per IP */
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI rate limit exceeded. Please wait a moment.' },
});

/** Strict AI limiter for expensive streaming — 10 per minute per IP */
export const aiStreamLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Streaming rate limit exceeded. Please wait a moment.' },
});

/** Auth limiter — 10 attempts per 15 minutes per IP (brute-force protection) */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
});
