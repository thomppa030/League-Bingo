import { config } from './config.js';

interface SessionData {
  id: string;
  gmId: string;
  players: Array<{ id: string; name: string }>;
}

export class SessionValidator {
  private sessionCache: Map<string, { data: SessionData; expires: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  async validateSession(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      // Check if player exists in session
      return session.players.some(p => p.id === playerId);
    } catch (error) {
      console.error('[Validator] Error validating session:', error);
      return false;
    }
  }

  async validatePlayer(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      return session.players.some(p => p.id === playerId);
    } catch (error) {
      console.error('[Validator] Error validating player:', error);
      return false;
    }
  }

  async isGameMaster(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      return session.gmId === playerId;
    } catch (error) {
      console.error('[Validator] Error checking GM status:', error);
      return false;
    }
  }

  private async getSession(sessionId: string): Promise<SessionData | null> {
    // Check cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // Fetch from API server
      const response = await fetch(`${config.api.url}/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        return null;
      }

      // Cache the result
      this.sessionCache.set(sessionId, {
        data: result.data,
        expires: Date.now() + this.CACHE_TTL,
      });

      return result.data;
    } catch (error) {
      console.error('[Validator] Error fetching session:', error);
      return null;
    }
  }

  clearCache(): void {
    this.sessionCache.clear();
  }

  clearSessionCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
  }
}