export declare class SessionValidator {
    private sessionCache;
    private readonly CACHE_TTL;
    validateSession(sessionId: string, playerId: string): Promise<boolean>;
    validatePlayer(sessionId: string, playerId: string): Promise<boolean>;
    isGameMaster(sessionId: string, playerId: string): Promise<boolean>;
    private getSession;
    clearCache(): void;
    clearSessionCache(sessionId: string): void;
}
//# sourceMappingURL=SessionValidator.d.ts.map