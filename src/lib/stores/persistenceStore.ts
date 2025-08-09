import { browser } from '$app/environment';
import type { Session, Player } from '../types';

const STORAGE_KEYS = {
  SESSION: 'league_bingo_session',
  PLAYER: 'league_bingo_player',
  ROUTE: 'league_bingo_route',
} as const;

export class PersistenceManager {
  private isAvailable(): boolean {
    return browser && typeof window !== 'undefined' && window.localStorage;
  }

  saveSession(session: Session | null): void {
    if (!this.isAvailable()) return;
    
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }

  loadSession(): Session | null {
    if (!this.isAvailable()) return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!stored) return null;
      
      const session = JSON.parse(stored);
      // Convert date strings back to Date objects
      if (session.createdAt) session.createdAt = new Date(session.createdAt);
      if (session.startedAt) session.startedAt = new Date(session.startedAt);
      if (session.endedAt) session.endedAt = new Date(session.endedAt);
      
      // Convert dates in cards if they exist
      if (session.cards) {
        session.cards = session.cards.map((card: any) => ({
          ...card,
          squares: card.squares.map((row: any) =>
            row.map((square: any) => ({
              ...square,
              completedAt: square.completedAt ? new Date(square.completedAt) : undefined
            }))
          )
        }));
      }
      
      return session;
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      return null;
    }
  }

  savePlayer(player: Player | null): void {
    if (!this.isAvailable()) return;
    
    try {
      if (player) {
        localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PLAYER);
      }
    } catch (error) {
      console.error('Failed to save player to localStorage:', error);
    }
  }

  loadPlayer(): Player | null {
    if (!this.isAvailable()) return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYER);
      if (!stored) return null;
      
      const player = JSON.parse(stored);
      if (player.joinedAt) player.joinedAt = new Date(player.joinedAt);
      
      return player;
    } catch (error) {
      console.error('Failed to load player from localStorage:', error);
      return null;
    }
  }

  saveRoute(route: string): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTE, route);
    } catch (error) {
      console.error('Failed to save route to localStorage:', error);
    }
  }

  loadRoute(): string | null {
    if (!this.isAvailable()) return null;
    
    try {
      return localStorage.getItem(STORAGE_KEYS.ROUTE);
    } catch (error) {
      console.error('Failed to load route from localStorage:', error);
      return null;
    }
  }

  clearAll(): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.PLAYER);
      localStorage.removeItem(STORAGE_KEYS.ROUTE);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  clearRoute(): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.ROUTE);
    } catch (error) {
      console.error('Failed to clear route from localStorage:', error);
    }
  }
}

export const persistenceManager = new PersistenceManager();