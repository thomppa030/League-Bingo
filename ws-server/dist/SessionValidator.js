import { config } from './config.js';
export class SessionValidator {
    sessionCache = new Map();
    CACHE_TTL = 60000; // 1 minute
    async validateSession(sessionId, playerId) {
        try {
            console.log(`[Validator] 🔍 Validating sessionId=${sessionId}, playerId=${playerId}`);
            const session = await this.getSession(sessionId);
            if (!session) {
                console.log(`[Validator] ❌ Session ${sessionId} not found`);
                return false;
            }
            console.log(`[Validator] 📋 Session found with ${session.players.length} players:`);
            session.players.forEach(p => console.log(`  - Player: ${p.id} (${p.name})`));
            console.log(`[Validator] 👑 GM: ${session.gmId}`);
            // Check if player exists in session
            const playerExists = session.players.some(p => p.id === playerId);
            console.log(`[Validator] ${playerExists ? '✅' : '❌'} Player ${playerId} ${playerExists ? 'found' : 'not found'} in session`);
            return playerExists;
        }
        catch (error) {
            console.error('[Validator] Error validating session:', error);
            return false;
        }
    }
    async validatePlayer(sessionId, playerId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session)
                return false;
            return session.players.some(p => p.id === playerId);
        }
        catch (error) {
            console.error('[Validator] Error validating player:', error);
            return false;
        }
    }
    async isGameMaster(sessionId, playerId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session)
                return false;
            return session.gmId === playerId;
        }
        catch (error) {
            console.error('[Validator] Error checking GM status:', error);
            return false;
        }
    }
    async getSession(sessionId) {
        // Check cache first
        const cached = this.sessionCache.get(sessionId);
        if (cached && cached.expires > Date.now()) {
            console.log(`[Validator] 💾 Using cached session data for ${sessionId}`);
            return cached.data;
        }
        try {
            // Fetch from API server
            const apiUrl = `${config.api.url}/api/sessions/${sessionId}`;
            console.log(`[Validator] 🌐 Fetching session from API: ${apiUrl}`);
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`[Validator] 📡 API Response status: ${response.status}`);
            if (!response.ok) {
                console.log(`[Validator] ❌ API request failed with status ${response.status}`);
                return null;
            }
            const result = await response.json();
            console.log(`[Validator] 📦 API Response:`, result);
            if (!result.success || !result.data) {
                console.log(`[Validator] ❌ API returned unsuccessful result or no data`);
                return null;
            }
            // Cache the result
            this.sessionCache.set(sessionId, {
                data: result.data,
                expires: Date.now() + this.CACHE_TTL,
            });
            console.log(`[Validator] ✅ Session data fetched and cached successfully`);
            return result.data;
        }
        catch (error) {
            console.error('[Validator] ❌ Error fetching session:', error);
            return null;
        }
    }
    clearCache() {
        this.sessionCache.clear();
    }
    clearSessionCache(sessionId) {
        this.sessionCache.delete(sessionId);
    }
}
//# sourceMappingURL=SessionValidator.js.map