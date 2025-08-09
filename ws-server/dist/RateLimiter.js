import { config } from './config.js';
export class RateLimiter {
    limits = new Map();
    windowMs = 60000; // 1 minute
    maxRequests = config.security.rateLimitMessagesPerMinute;
    checkLimit(identifier) {
        const now = Date.now();
        const entry = this.limits.get(identifier);
        if (!entry || now > entry.resetTime) {
            // Create new entry
            this.limits.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }
        if (entry.count >= this.maxRequests) {
            return false;
        }
        entry.count++;
        return true;
    }
    reset(identifier) {
        this.limits.delete(identifier);
    }
    // Clean up expired entries periodically
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}
// Run cleanup every 5 minutes
setInterval(() => {
    new RateLimiter().cleanup();
}, 300000);
//# sourceMappingURL=RateLimiter.js.map