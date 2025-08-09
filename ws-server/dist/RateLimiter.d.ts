export declare class RateLimiter {
    private limits;
    private readonly windowMs;
    private readonly maxRequests;
    checkLimit(identifier: string): boolean;
    reset(identifier: string): void;
    cleanup(): void;
}
//# sourceMappingURL=RateLimiter.d.ts.map