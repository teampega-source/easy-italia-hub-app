// api/_ratelimit.js — best-effort, zero-dependency rate limiter shared by the
// public POST endpoints (chat, contact, remind, stripe-donate).
//
// Same design as the original limiter in chat.js: a per-warm-instance, in-memory
// sliding window keyed by client IP. It FAILS OPEN (any error or unknown IP lets
// the request through) so it can never break a legitimate call.
//
// CAVEAT (intentional): serverless instances are ephemeral and many can run in
// parallel, so this is NOT a global guarantee — it blunts bursty abuse from a
// single IP that hits the same warm instance. For hard limits add an edge/WAF
// rule (Vercel Firewall) or a shared store (Upstash/Redis). This is the cheap,
// dependency-free complement that protects the cost-bearing endpoints (Resend
// emails, Stripe sessions, Gemini calls) from trivial scripted floods.
'use strict';

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_HITS = 20;
const MAX_KEYS = 5000; // cap map size so a long-lived instance can't grow unbounded

// One bucket map per limiter "name" so endpoints don't share each other's counts.
const buckets = new Map(); // name -> Map(ip -> number[])

/** Best-effort client IP from x-forwarded-for (first hop). Empty string if unknown. */
function clientIp(req) {
  try {
    const xff = req.headers?.['x-forwarded-for'];
    const raw = Array.isArray(xff) ? xff[0] : xff;
    return (raw || '').split(',')[0].trim();
  } catch {
    return '';
  }
}

/**
 * Returns true if this IP is over the limit on this instance. FAILS OPEN.
 * @param {string} ip      client IP (empty/unknown → never limited)
 * @param {object} [opts]
 * @param {string} [opts.name='default'] separate counter namespace per endpoint
 * @param {number} [opts.windowMs]       sliding-window length (ms)
 * @param {number} [opts.max]            max hits per IP per window on one instance
 */
function isRateLimited(ip, opts = {}) {
  try {
    if (!ip) return false; // unknown client → don't block
    const name = opts.name || 'default';
    const windowMs = opts.windowMs || DEFAULT_WINDOW_MS;
    const max = opts.max || DEFAULT_MAX_HITS;

    let hits = buckets.get(name);
    if (!hits) { hits = new Map(); buckets.set(name, hits); }
    if (hits.size > MAX_KEYS) hits.clear(); // opportunistic cleanup

    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(ip, arr);
    return arr.length > max;
  } catch {
    return false; // never let the limiter break a real request
  }
}

module.exports = { isRateLimited, clientIp };
