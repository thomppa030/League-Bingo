import { derived, get, writable } from "svelte/store";
import type {
  ApiResponse,
  CreateSessionRequest,
  JoinSessionRequest,
  Player,
  Session,
  SessionStatus,
  WSMessage,
  WSMessageType,
} from "../types.ts";

export const currentSession = writable<Session | null>(null);
export const currentPlayer = writable<Player | null>(null);
export const connectionStatus = writable<
  "connected" | "connecting" | "disconnected"
>("disconnected");
export const wsConnection = writable<WebSocket | null>(null);

export const isGM = derived(
  currentPlayer,
  ($currentSession) => $currentSession?.isGM ?? false,
);

export const sessionPlayers = derived(
  currentSession,
  ($currentSession) => $currentSession?.players ?? [],
);

export const isSessionActive = derived(
  currentSession,
  ($currentSession) => $currentSession?.status === "playing",
);

export const canStartGame = derived(
  [currentSession, isGM],
  ([$currentSession, $isGM]) => {
    if (!$currentSession || !$isGM) return false;
    return $currentSession.players.length >= ($currentSession.minPlayers || 1) &&
      $currentSession.players.every((p) => p.isReady);
  },
);

class SessionManager {
  private wsUrl: string = "";
  private reconnectedAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectedDelay = 1000;

  constructor() {
    // WebSocket server URL - defaults to local development
    // In production, set VITE_WS_URL to your WebSocket server URL
    this.wsUrl = import.meta.env?.VITE_WS_URL || 'ws://localhost:8080';
  }

  async createSession(
    request: CreateSessionRequest,
  ): Promise<ApiResponse<Session>> {
    try {
      const response = await fetch("api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result: ApiResponse<Session> = await response.json();

      if (result.success && result.data) {
        currentSession.set(result.data);
        const gmPlayer = result.data.players.find((p) => p.isGM);
        if (gmPlayer) {
          currentPlayer.set(gmPlayer);
        }
        this.connectWebSocket(result.data.id);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to create session",
        },
        timestamp: new Date(),
      };
    }
  }

  async joinSession(
    request: JoinSessionRequest,
  ): Promise<ApiResponse<{ session: Session; player: Player }>> {
    try {
      const response = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result: ApiResponse<{ session: Session; player: Player }> =
        await response.json();

      if (result.success && result.data) {
        currentSession.set(result.data.session);
        currentPlayer.set(result.data.player);
        this.connectWebSocket(result.data.session.id);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to join session",
        },
        timestamp: new Date(),
      };
    }
  }

  async leaveSession(): Promise<void> {
    const session = get(currentSession);
    const player = get(currentPlayer);

    if (!session || !player) return;

    try {
      await fetch(`/api/sessions/${session.id}/players/${player.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to leave session:", error);
    } finally {
      this.cleanup();
    }
  }

  async updatePlayerReady(ready: boolean): Promise<void> {
    const session = get(currentSession);
    const player = get(currentPlayer);

    if (!session || !player) return;

    try {
      const response = await fetch(
        `/api/sessions/${session.id}/players/${player.id}/ready`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ready }),
        },
      );
    } catch (error) {
      console.error("Failed to update ready status:", error);
    }
  }

  async updatePlayerCategories(categories: string[]): Promise<void> {
    const session = get(currentSession);
    const player = get(currentPlayer);

    if (!session || !player) return;

    try {
      const response = await fetch(
        `/api/sessions/${session.id}/players/${player.id}/categories`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories }),
        },
      );

      if (response.ok) {
        //Update will come through WebSocket
      }
    } catch (error) {
      console.error("Failed to update categories:", error);
    }
  }

  async generateCards(): Promise<ApiResponse<boolean>> {
    const session = get(currentSession);

    if (!session) {
      console.error('No session available for card generation');
      return {
        success: false,
        error: { code: "NO_SESSION", message: "No active session" },
        timestamp: new Date(),
      };
    }

    console.log('Starting card generation for session:', session.id);

    try {
      const response = await fetch(
        `/api/sessions/${session.id}/generate-cards`,
        {
          method: "POST",
        },
      );

      console.log('Card generation response status:', response.status);
      const result = await response.json();
      console.log('Card generation result:', result);
      
      // If WebSocket is not connected, manually update the session with cards
      const wsStatus = get(connectionStatus);
      if (result.success && result.data && wsStatus !== 'connected') {
        console.log('WebSocket not connected, manually updating session with cards');
        currentSession.update((s) => {
          if (!s) return s;
          return {
            ...s,
            status: "playing" as SessionStatus,
            cards: result.data,
          };
        });
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to generate cards",
        },
        timestamp: new Date(),
      };
    }
  }

  async startGame(): Promise<ApiResponse<boolean>> {
    const session = get(currentSession);

    if (!session) {
      return {
        success: false,
        error: {
          code: "NO_SESSION",
          message: "No active Session",
        },
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch(`/api/sessions/${session.id}/start`, {
        method: "POST",
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to start game",
        },
        timestamp: new Date(),
      };
    }
  }

  async claimSquare(squareId: string, evidence?: string): Promise<void> {
    const ws = get(wsConnection);
    const player = get(currentPlayer);
    const session = get(currentSession);
    
    if (!ws || !player || !session) {
      console.error("Cannot claim square: No WebSocket connection, player data, or session");
      return;
    }

    const message: WSMessage = {
      type: "square_claimed" as WSMessageType,
      sessionId: session.id,
      timestamp: new Date(),
      data: {
        playerId: player.id,
        squareId,
        evidence,
        timestamp: new Date(),
      },
    };

    ws.send(JSON.stringify(message));
  }

  async confirmSquare(playerId: string, squareId: string): Promise<void> {
    const ws = get(wsConnection);
    const player = get(currentPlayer);
    const session = get(currentSession);
    
    if (!ws || !player || !player.isGM || !session) {
      console.error("Cannot confirm square: No WebSocket connection, not GM, or no session");
      return;
    }

    const message: WSMessage = {
      type: "square_confirmed" as WSMessageType,
      sessionId: session.id,
      timestamp: new Date(),
      data: {
        playerId,
        squareId,
        gmId: player.id,
        timestamp: new Date(),
      },
    };

    ws.send(JSON.stringify(message));
  }

  async rejectSquare(playerId: string, squareId: string): Promise<void> {
    const ws = get(wsConnection);
    const player = get(currentPlayer);
    const session = get(currentSession);
    
    if (!ws || !player || !player.isGM || !session) {
      console.error("Cannot reject square: No WebSocket connection, not GM, or no session");
      return;
    }

    const message: WSMessage = {
      type: "square_rejected" as WSMessageType,
      sessionId: session.id,
      timestamp: new Date(),
      data: {
        playerId,
        squareId,
        gmId: player.id,
        timestamp: new Date(),
      },
    };

    ws.send(JSON.stringify(message));
  }

  private connectWebSocket(sessionId: string): void {
    connectionStatus.set("connecting");
    
    const player = get(currentPlayer);
    if (!player) {
      console.error("No player data available for WebSocket connection");
      return;
    }

    try {
      const ws = new WebSocket(`${this.wsUrl}?sessionId=${sessionId}&playerId=${player.id}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        connectionStatus.set("connected");
        wsConnection.set(ws);
        this.reconnectedAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.log("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        connectionStatus.set("disconnected");
        wsConnection.set(null);
        this.attemptReconnect(sessionId);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        connectionStatus.set("disconnected");
      };
    } catch (error) {
      console.log("Failed to connect WebSocket:", error);
      connectionStatus.set("disconnected");
    }
  }

  private attemptReconnect(sessionId: string): void {
    if (this.reconnectedAttempts < this.maxReconnectAttempts) {
      this.reconnectedAttempts++;
      const delay = this.reconnectedDelay *
        Math.pow(2, this.reconnectedAttempts - 1);
      setTimeout(() => {
        console.log(
          `Attempting to reconnect (${this.reconnectedAttempts}/${this.maxReconnectAttempts})`,
        );
        this.connectWebSocket(sessionId);
      }, delay);
    }
  }

  private handleWebSocketMessage(message: WSMessage): void {
    const session = get(currentSession);

    if (!session) return;

    switch (message.type) {
      case "session_updated":
        currentSession.set(message.data);
        break;
      case "player_joined":
        currentSession.update((s) => {
          if (!s) return s;
          return {
            ...s,
            players: [...s.players, message.data],
          };
        });
        break;
      case "player_left":
        currentSession.update((s) => {
          if (!s) return s;
          return {
            ...s,
            players: s.players.filter((p) => p.id != message.data.playerId),
          };
        });
        break;

      case "player_updated":
        currentSession.update((s) => {
          if (!s) return s;
          return {
            ...s,
            players: s.players.map((p) =>
              p.id === message.data.id ? message.data : p
            ),
          };
        });

        const currentPlayerData = get(currentPlayer);
        if (currentPlayerData && currentPlayerData.id === message.data.id) {
          currentPlayer.set(message.data);
        }
        break;

      case "cards_generated":
        console.log('Received cards_generated message:', message);
        console.log('Cards data:', message.data);
        currentSession.update((s) => {
          if (!s) return s;
          console.log('Updating session with cards, count:', message.data?.length || 0);
          return {
            ...s,
            status: "playing" as SessionStatus,
            cards: message.data,
          };
        });
        break;

      case "game_started":
        currentSession.update((s) => {
          if (!s) return s;
          return {
            ...s,
            status: "playing" as SessionStatus,
          };
        });
        break;

      case "square_claimed":
        // Update the square status in the player's card
        currentSession.update((s) => {
          if (!s || !s.cards) return s;
          
          const updatedCards = s.cards.map(card => {
            if (card.playerID === message.data.playerId) {
              return {
                ...card,
                squares: card.squares.map(row =>
                  row.map(square => 
                    square.id === message.data.squareId
                      ? { ...square, isCompleted: true, completedAt: message.data.timestamp }
                      : square
                  )
                ),
              };
            }
            return card;
          });
          
          return { ...s, cards: updatedCards };
        });
        break;

      case "square_confirmed":
        // GM confirmed a square claim
        currentSession.update((s) => {
          if (!s || !s.cards) return s;
          
          const updatedCards = s.cards.map(card => {
            if (card.playerID === message.data.playerId) {
              return {
                ...card,
                squares: card.squares.map(row =>
                  row.map(square => 
                    square.id === message.data.squareId
                      ? { ...square, isConfirmed: true }
                      : square
                  )
                ),
              };
            }
            return card;
          });
          
          // Update player scores
          const updatedPlayers = s.players.map(p => 
            p.id === message.data.playerId
              ? { ...p, totalScore: p.totalScore + (message.data.points || 0) }
              : p
          );
          
          return { ...s, cards: updatedCards, players: updatedPlayers };
        });
        break;

      case "pattern_completed":
        // A player completed a pattern
        currentSession.update((s) => {
          if (!s || !s.cards) return s;
          
          const updatedCards = s.cards.map(card => {
            if (card.playerID === message.data.playerId) {
              return {
                ...card,
                completedPatterns: [...card.completedPatterns, message.data.pattern],
              };
            }
            return card;
          });
          
          return { ...s, cards: updatedCards };
        });
        break;

      case "error":
        console.error("WebSocket error:", message.data);
        break;

      default:
        console.log("Unhandled WebSocket message:", message);
    }
  }

  private cleanup(): void {
    const ws = get(wsConnection);
    if (ws) {
      ws.close();
    }

    currentSession.set(null);
    currentPlayer.set(null);
    connectionStatus.set("disconnected");
    wsConnection.set(null);
    this.reconnectedAttempts = 0;
  }

  getSession(): Session | null {
    return get(currentSession);
  }

  getPlayer(): Player | null {
    return get(currentPlayer);
  }
}

export const sessionManager = new SessionManager();

export function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validatePlayerName(
  name: string,
): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }

  if (name.length > 20) {
    return { valid: false, error: "Name must be 20 Characters or Less" };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return {
      valid: false,
      error: "Name can only contain letters, spaces, hyphens and underscores",
    };
  }

  return { valid: true };
}

export function validateSessionName(
  name: string,
): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Session name is required" };
  }

  if (name.length > 50) {
    return {
      valid: false,
      error: "Session name must be 50 characters or less",
    };
  }

  return { valid: true };
}
