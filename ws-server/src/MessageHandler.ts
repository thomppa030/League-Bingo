import type { AuthenticatedWebSocket, WSMessage } from './types.js';
import { WSMessageType } from './types.js';
import type { ConnectionManager } from './ConnectionManager.js';
import type { SessionValidator } from './SessionValidator.js';

export class MessageHandler {
  constructor(
    private connectionManager: ConnectionManager,
    private sessionValidator: SessionValidator
  ) {}

  async handleMessage(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    console.log(`[Message] type=${message.type}, session=${ws.sessionId}, player=${ws.playerId}`);

    try {
      switch (message.type) {
        case WSMessageType.HEARTBEAT:
          this.handleHeartbeat(ws);
          break;

        case WSMessageType.PLAYER_UPDATED:
          await this.handlePlayerUpdate(ws, message);
          break;

        case WSMessageType.SQUARE_CLAIMED:
          await this.handleSquareClaim(ws, message);
          break;

        case WSMessageType.SQUARE_CONFIRMED:
          await this.handleSquareConfirmation(ws, message);
          break;

        case WSMessageType.SQUARE_REJECTED:
          await this.handleSquareRejection(ws, message);
          break;

        default:
          console.warn(`[Message] Unknown type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[Message] Error handling ${message.type}:`, error);
      this.sendError(ws, 'Failed to process message');
    }
  }

  private handleHeartbeat(ws: AuthenticatedWebSocket): void {
    this.connectionManager.markAlive(ws);
    ws.send(JSON.stringify({
      type: WSMessageType.HEARTBEAT,
      timestamp: new Date()
    }));
  }

  private async handlePlayerUpdate(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    if (!ws.sessionId) return;

    // Validate player belongs to session
    const isValid = await this.sessionValidator.validatePlayer(ws.sessionId, ws.playerId!);
    if (!isValid) {
      this.sendError(ws, 'Invalid player or session');
      return;
    }

    // Broadcast to all players in session
    this.connectionManager.broadcastToSession(ws.sessionId, {
      type: WSMessageType.PLAYER_UPDATED,
      sessionId: ws.sessionId,
      playerId: ws.playerId,
      data: message.data,
      timestamp: new Date()
    });
  }

  private async handleSquareClaim(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    if (!ws.sessionId || !ws.playerId) return;

    // Validate claim data
    const { squareId, evidence } = message.data;
    if (!squareId) {
      this.sendError(ws, 'Square ID required');
      return;
    }

    // Broadcast claim to all players
    this.connectionManager.broadcastToSession(ws.sessionId, {
      type: WSMessageType.SQUARE_CLAIMED,
      sessionId: ws.sessionId,
      playerId: ws.playerId,
      data: {
        squareId,
        evidence,
        claimedAt: new Date()
      },
      timestamp: new Date()
    });
  }

  private async handleSquareConfirmation(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    if (!ws.sessionId) return;

    // Validate that player is GM
    const isGM = await this.sessionValidator.isGameMaster(ws.sessionId, ws.playerId!);
    if (!isGM) {
      this.sendError(ws, 'Only GM can confirm squares');
      return;
    }

    // Broadcast confirmation
    this.connectionManager.broadcastToSession(ws.sessionId, {
      type: WSMessageType.SQUARE_CONFIRMED,
      sessionId: ws.sessionId,
      playerId: message.data.playerId, // Player whose square was confirmed
      data: {
        squareId: message.data.squareId,
        confirmedBy: ws.playerId,
        confirmedAt: new Date()
      },
      timestamp: new Date()
    });

    // Check for pattern completion
    // This would typically involve checking the game state
    // For now, we'll just broadcast if a pattern is indicated
    if (message.data.patternCompleted) {
      this.connectionManager.broadcastToSession(ws.sessionId, {
        type: WSMessageType.PATTERN_COMPLETED,
        sessionId: ws.sessionId,
        playerId: message.data.playerId,
        data: {
          pattern: message.data.pattern,
          completedAt: new Date()
        },
        timestamp: new Date()
      });
    }
  }

  private async handleSquareRejection(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void> {
    if (!ws.sessionId) return;

    // Validate that player is GM
    const isGM = await this.sessionValidator.isGameMaster(ws.sessionId, ws.playerId!);
    if (!isGM) {
      this.sendError(ws, 'Only GM can reject squares');
      return;
    }

    // Broadcast rejection
    this.connectionManager.broadcastToSession(ws.sessionId, {
      type: WSMessageType.SQUARE_REJECTED,
      sessionId: ws.sessionId,
      playerId: message.data.playerId,
      data: {
        squareId: message.data.squareId,
        reason: message.data.reason,
        rejectedBy: ws.playerId,
        rejectedAt: new Date()
      },
      timestamp: new Date()
    });
  }

  private sendError(ws: AuthenticatedWebSocket, error: string): void {
    ws.send(JSON.stringify({
      type: WSMessageType.ERROR,
      error,
      timestamp: new Date()
    }));
  }
}