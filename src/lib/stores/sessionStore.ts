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
import { persistenceManager } from "./persistenceStore";

export const currentSession = writable<Session | null>(null);
export const currentPlayer = writable<Player | null>(null);

// Subscribe to store changes to persist them
currentSession.subscribe((session) => {
  persistenceManager.saveSession(session);
});

currentPlayer.subscribe((player) => {
  persistenceManager.savePlayer(player);
});
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
  private hasRestored = false;

  constructor() {
    // WebSocket server URL - defaults to local development
    // In production, set VITE_WS_URL to your WebSocket server URL
    this.wsUrl = import.meta.env?.VITE_WS_URL || 'ws://localhost:8080';
    console.log('WebSocket URL configured:', this.wsUrl);
    console.log('Environment:', import.meta.env.MODE);
    
    // Perform network diagnostics only in browser
    if (typeof window !== 'undefined') {
      this.performNetworkDiagnostics();
    }
  }

  private async performNetworkDiagnostics(): Promise<void> {
    console.log("🔍 Network Diagnostics:");
    console.log("🌐 Navigator online:", typeof navigator !== 'undefined' ? navigator.onLine : undefined);
    console.log("🔌 Connection type:", typeof navigator !== 'undefined' ? (navigator as any).connection?.effectiveType || 'unknown' : 'unknown');
    console.log("📡 Connection downlink:", typeof navigator !== 'undefined' ? (navigator as any).connection?.downlink || 'unknown' : 'unknown');
    console.log("🛡️ Secure context:", typeof window !== 'undefined' ? window.isSecureContext : undefined);
    console.log("🖥️ Platform:", typeof navigator !== 'undefined' ? navigator.platform : 'unknown');
    console.log("🌍 User Agent:", typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown');
    
    const wsHost = this.wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    
    // Test basic connectivity to WebSocket server
    try {
      const healthUrl = `${wsHost}/health`;
      console.log("🏥 Testing connectivity to:", healthUrl);
      
      const healthResponse = await fetch(healthUrl, { 
        method: 'GET',
        mode: 'cors'
      });
      
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        console.log("✅ Server health check passed:", data);
      } else {
        console.warn("⚠️ Server health check failed:", healthResponse.status);
      }
    } catch (error) {
      console.error("❌ Cannot reach WebSocket server health endpoint:", error);
    }

    // Test detailed connection diagnostics
    try {
      const debugUrl = `${wsHost}/debug/connection`;
      console.log("🔧 Testing debug endpoint:", debugUrl);
      
      const debugResponse = await fetch(debugUrl, { 
        method: 'GET',
        mode: 'cors'
      });
      
      if (debugResponse.ok) {
        const diagnostics = await debugResponse.json();
        console.log("🔧 Server connection diagnostics:", diagnostics);
        
        // Check for potential issues
        if (!diagnostics.client.connectionAllowed) {
          console.error("❌ CORS Issue: Origin not allowed by server");
        }
        
        if (diagnostics.client.ipConnectionCount >= diagnostics.server.maxConnectionsPerIp) {
          console.warn("⚠️ Rate Limit: Too many connections from this IP");
        }
      } else {
        console.warn("⚠️ Debug endpoint failed:", debugResponse.status);
      }
    } catch (error) {
      console.error("❌ Cannot reach debug endpoint:", error);
      console.error("🔍 This might indicate network/firewall issues or CORS restrictions");
    }
  }

  async restoreSession(): Promise<boolean> {
    if (this.hasRestored) return false;
    this.hasRestored = true;

    const savedSession = persistenceManager.loadSession();
    const savedPlayer = persistenceManager.loadPlayer();

    if (savedSession && savedPlayer) {
      console.log('Restoring session from localStorage:', savedSession.id);
      
      // Restore the stores
      currentSession.set(savedSession);
      currentPlayer.set(savedPlayer);
      
      // Reconnect WebSocket if session is active
      if (savedSession.status !== 'completed') {
        this.connectWebSocket(savedSession.id);
      }
      
      return true;
    }
    
    return false;
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
    // Retry logic for session join
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting to join session (${attempt}/${maxRetries})...`);
        
        const response = await fetch("/api/sessions/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        const result: ApiResponse<{ session: Session; player: Player }> =
          await response.json();

        if (result.success && result.data) {
          console.log("✅ Successfully joined session");
          currentSession.set(result.data.session);
          currentPlayer.set(result.data.player);
          
          // Add delay for player joins to ensure session validation works
          // The WebSocket server needs time to sync session data
          console.log("🔄 Player joined session, waiting 1s before WebSocket connection...");
          setTimeout(() => {
            this.connectWebSocket(result.data.session.id);
          }, 1000);
          
          return result;
        }
        
        // If join failed, log the error and potentially retry
        console.warn(`❌ Join attempt ${attempt} failed:`, result.error);
        
        // Don't retry if it's a validation error (duplicate name, session full, etc.)
        if (result.error?.code && [
          'DUPLICATE_PLAYER_NAME',
          'SESSION_FULL', 
          'GAME_ALREADY_STARTED',
          'VALIDATION_ERROR'
        ].includes(result.error.code)) {
          console.log("🚫 Not retrying due to validation error");
          return result;
        }
        
        // If this is the last attempt, return the error
        if (attempt === maxRetries) {
          return result;
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
      } catch (error) {
        console.error(`❌ Network error on join attempt ${attempt}:`, error);
        
        // If this is the last attempt, return network error
        if (attempt === maxRetries) {
          return {
            success: false,
            error: {
              code: "NETWORK_ERROR",
              message: "Failed to join session after retries",
            },
            timestamp: new Date(),
          };
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${retryDelay}ms before network retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // Should never reach here, but just in case
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to join session",
      },
      timestamp: new Date(),
    };
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

    if (!session || !player) {
      console.error("Cannot update ready status: missing session or player");
      return;
    }

    try {
      console.log(`Updating ready status to ${ready} for player ${player.id}`);
      
      // Optimistically update local state immediately
      const updatedPlayer = { ...player, isReady: ready };
      currentPlayer.set(updatedPlayer);
      
      // Update the player in the session as well
      currentSession.update(s => {
        if (!s) return s;
        return {
          ...s,
          players: s.players.map(p => 
            p.id === player.id ? updatedPlayer : p
          )
        };
      });
      
      const response = await fetch(
        `/api/sessions/${session.id}/players/${player.id}/ready`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ready }),
        },
      );
      
      if (!response.ok) {
        // Revert optimistic update on failure
        currentPlayer.set(player);
        currentSession.update(s => {
          if (!s) return s;
          return {
            ...s,
            players: s.players.map(p => 
              p.id === player.id ? player : p
            )
          };
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log("Ready status updated successfully");
      
    } catch (error) {
      console.error("Failed to update ready status:", error);
      throw error; // Re-throw so UI can handle it
    }
  }

  async updateSessionStatus(status: SessionStatus): Promise<void> {
    const session = get(currentSession);
    const player = get(currentPlayer);

    if (!session || !player || !player.isGM) return;

    try {
      const response = await fetch(
        `/api/sessions/${session.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      
      if (!response.ok) {
        throw new Error('Failed to update session status');
      }
      
      // The WebSocket will broadcast the status change to all players
    } catch (error) {
      console.error("Failed to update session status:", error);
      throw error;
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

    const connectionUrl = `${this.wsUrl}?sessionId=${sessionId}&playerId=${player.id}`;
    console.log("🔌 Attempting WebSocket connection...");
    console.log("📍 URL:", connectionUrl);
    console.log("🌐 User Agent:", navigator.userAgent);
    console.log("🖥️ Platform:", navigator.platform);
    console.log("📶 Online status:", navigator.onLine);
    console.log("🔒 Protocol:", location.protocol);
    console.log("🌍 Origin:", location.origin);

    try {
      const ws = new WebSocket(connectionUrl);
      console.log("⏳ WebSocket created, waiting for connection...");

      ws.onopen = () => {
        console.log("✅ WebSocket connected successfully!");
        console.log("🔗 Ready State:", ws.readyState);
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

      ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected");
        console.log("🔍 Close code:", event.code);
        console.log("📝 Close reason:", event.reason);
        console.log("🧹 Clean close:", event.wasClean);
        
        // Common close codes explanation
        const closeReasons = {
          1000: "Normal Closure",
          1001: "Going Away", 
          1002: "Protocol Error",
          1003: "Unsupported Data",
          1006: "Abnormal Closure (no close frame)",
          1011: "Server Error",
          1012: "Service Restart", 
          1013: "Try Again Later",
          1014: "Bad Gateway",
          1015: "TLS Handshake Failure"
        };
        
        console.log("📚 Code meaning:", closeReasons[event.code] || "Unknown");
        
        connectionStatus.set("disconnected");
        wsConnection.set(null);
        this.attemptReconnect(sessionId);
      };

      ws.onerror = (error) => {
        console.error("🚨 WebSocket error occurred:");
        console.error("🔍 Error event:", error);
        console.error("🔗 Ready State:", ws.readyState);
        console.error("📍 URL:", connectionUrl);
        
        // Check if it might be a network issue
        if (!navigator.onLine) {
          console.error("🌐 Network appears to be offline!");
        }
        
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
        console.log('Session updated via WebSocket:', message.data);
        // Only update if the session data is newer or has more complete data
        currentSession.update((s) => {
          if (!s) return message.data;
          
          // Preserve existing players if the update doesn't have complete player data
          const updatedSession = message.data;
          if (updatedSession.players && updatedSession.players.length < s.players.length) {
            console.log('WebSocket session update has fewer players, preserving existing players');
            return {
              ...updatedSession,
              players: s.players
            };
          }
          
          return updatedSession;
        });
        break;
        
      case "player_joined":
        console.log('Player joined event received:', message.data);
        console.log('Player data details:', {
          id: message.data.id,
          name: message.data.name,
          role: message.data.role,
          isGM: message.data.isGM,
          isReady: message.data.isReady
        });
        
        currentSession.update((s) => {
          if (!s) return s;
          
          console.log('Current session players before update:', s.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            isGM: p.isGM
          })));
          
          // Check if player already exists to prevent duplication
          const playerExists = s.players.some(p => p.id === message.data.id);
          if (playerExists) {
            console.log('Player already exists in session, updating instead of adding');
            const updatedSession = {
              ...s,
              players: s.players.map(p => 
                p.id === message.data.id ? message.data : p
              )
            };
            console.log('Players after update:', updatedSession.players.map(p => ({
              id: p.id,
              name: p.name,
              role: p.role,
              isGM: p.isGM
            })));
            return updatedSession;
          }
          
          console.log('Adding new player to session:', message.data);
          const updatedSession = {
            ...s,
            players: [...s.players, message.data],
          };
          console.log('Players after adding:', updatedSession.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            isGM: p.isGM
          })));
          return updatedSession;
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
        console.log('Player updated event received:', message.data);
        console.log('Updated player data details:', {
          id: message.data.id,
          name: message.data.name,
          role: message.data.role,
          isGM: message.data.isGM,
          isReady: message.data.isReady
        });
        
        currentSession.update((s) => {
          if (!s) return s;
          
          console.log('Current session players before player update:', s.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            isGM: p.isGM,
            isReady: p.isReady
          })));
          
          // Find if player exists
          const playerExists = s.players.some(p => p.id === message.data.id);
          if (!playerExists) {
            console.log('Player not found for update, adding as new player:', message.data);
            const updatedSession = {
              ...s,
              players: [...s.players, message.data]
            };
            console.log('Players after adding missing player:', updatedSession.players.map(p => ({
              id: p.id,
              name: p.name,
              role: p.role,
              isGM: p.isGM,
              isReady: p.isReady
            })));
            return updatedSession;
          }
          
          console.log('Updating existing player in session:', message.data);
          const updatedSession = {
            ...s,
            players: s.players.map((p) =>
              p.id === message.data.id ? { ...p, ...message.data } : p
            ),
          };
          console.log('Players after update:', updatedSession.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            isGM: p.isGM,
            isReady: p.isReady
          })));
          return updatedSession;
        });

        const currentPlayerData = get(currentPlayer);
        if (currentPlayerData && currentPlayerData.id === message.data.id) {
          console.log('Updating current player data');
          currentPlayer.set({ ...currentPlayerData, ...message.data });
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
    
    // Clear persistence when cleaning up
    persistenceManager.clearAll();
  }

  getSession(): Session | null {
    return get(currentSession);
  }

  getPlayer(): Player | null {
    return get(currentPlayer);
  }

  // Debug method to test WebSocket connection manually
  async testWebSocketConnection(): Promise<void> {
    console.log("🧪 Manual WebSocket Connection Test");
    
    await this.performNetworkDiagnostics();
    
    const testUrl = `${this.wsUrl}?sessionId=test&playerId=test`;
    console.log("🔗 Testing WebSocket URL:", testUrl);
    
    try {
      const testWs = new WebSocket(testUrl);
      let connectionResult = "unknown";
      
      testWs.onopen = () => {
        console.log("✅ Test WebSocket connection successful!");
        connectionResult = "success";
        testWs.close(1000, "Test completed");
      };
      
      testWs.onerror = (error) => {
        console.error("❌ Test WebSocket connection failed:", error);
        connectionResult = "error";
      };
      
      testWs.onclose = (event) => {
        console.log("🔒 Test WebSocket closed:", event.code, event.reason);
        
        if (event.code === 1006 && connectionResult !== "success") {
          console.error("🚨 ABNORMAL CLOSURE DETECTED (Code 1006)");
          console.log("🔍 This usually indicates:");
          console.log("  • Network connectivity issues");
          console.log("  • Firewall blocking WebSocket connections");
          console.log("  • Proxy server interference");
          console.log("  • Antivirus software blocking connections");
          console.log("  • ISP blocking WebSocket traffic");
          console.log("  • CORS policy blocking the connection");
          
          this.suggestTroubleshootingSteps();
        }
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (testWs.readyState !== WebSocket.OPEN && testWs.readyState !== WebSocket.CLOSED) {
          console.error("⏰ Test WebSocket connection timeout");
          testWs.close();
        }
      }, 10000);
      
    } catch (error) {
      console.error("🚨 Failed to create test WebSocket:", error);
    }
  }

  private suggestTroubleshootingSteps(): void {
    console.log("🔧 Troubleshooting Steps for Abnormal Closure:");
    console.log("1. 🛡️ Check firewall settings - allow outbound connections on port 443/80");
    console.log("2. 🦠 Temporarily disable antivirus/security software");
    console.log("3. 🌐 Try from a different network (mobile hotspot)");
    console.log("4. 🔒 Check if corporate proxy is blocking WebSocket connections");
    console.log("5. 🌍 Try from a different browser or incognito mode");
    console.log("6. 📱 Test from mobile device on same network");
    console.log("7. 🔧 Contact network administrator about WebSocket policies");
    
    // Test if it's a browser-specific issue
    console.log("🌐 Browser Info:");
    console.log("  • User Agent:", navigator.userAgent);
    console.log("  • Platform:", navigator.platform);
    console.log("  • WebSocket Support:", 'WebSocket' in window);
    console.log("  • Online Status:", navigator.onLine);
  }
}

export const sessionManager = new SessionManager();

// Expose sessionManager globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).sessionManager = sessionManager;
  console.log("🛠️ sessionManager exposed globally for debugging");
  console.log("💡 Try: sessionManager.testWebSocketConnection()");
}

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
