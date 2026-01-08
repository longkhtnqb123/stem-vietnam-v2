// Rate Limiting - Protect API from abuse
// Chú thích: Per-user rate limits với Cloudflare KV

export interface RateLimit {
    userId: string;
    requests: number;
    resetAt: number;
}

/**
 * Rate limiter using KV
 */
export class RateLimiter {
    private kv: KVNamespace;
    private maxRequests: number;
    private windowMs: number;

    constructor(kv: KVNamespace, maxRequests = 100, windowMs = 3600000) {
        this.kv = kv;
        this.maxRequests = maxRequests; // 100 requests
        this.windowMs = windowMs; // 1 hour window
    }

    /**
     * Check if request is allowed
     */
    async isAllowed(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
        const key = `ratelimit:${userId}`;
        const now = Date.now();

        // Get current limit
        const current = await this.kv.get(key, 'json') as RateLimit | null;

        // First request or window expired
        if (!current || current.resetAt < now) {
            const newLimit: RateLimit = {
                userId,
                requests: 1,
                resetAt: now + this.windowMs
            };

            await this.kv.put(key, JSON.stringify(newLimit), {
                expirationTtl: Math.ceil(this.windowMs / 1000)
            });

            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetAt: newLimit.resetAt
            };
        }

        // Check if limit exceeded
        if (current.requests >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: current.resetAt
            };
        }

        // Increment counter
        current.requests++;
        await this.kv.put(key, JSON.stringify(current), {
            expirationTtl: Math.ceil((current.resetAt - now) / 1000)
        });

        return {
            allowed: true,
            remaining: this.maxRequests - current.requests,
            resetAt: current.resetAt
        };
    }

    /**
     * Get current usage
     */
    async getUsage(userId: string): Promise<{ requests: number; limit: number; resetAt: number }> {
        const key = `ratelimit:${userId}`;
        const current = await this.kv.get(key, 'json') as RateLimit | null;

        if (!current) {
            return {
                requests: 0,
                limit: this.maxRequests,
                resetAt: Date.now() + this.windowMs
            };
        }

        return {
            requests: current.requests,
            limit: this.maxRequests,
            resetAt: current.resetAt
        };
    }
}
