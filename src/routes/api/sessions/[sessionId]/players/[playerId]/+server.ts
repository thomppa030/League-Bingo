import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';
import { sessions, sessionsByCode, broadcastToSession } from '$lib/server/sessionStore';

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { sessionId, playerId } = params;
    
    const session = sessions.get(sessionId);
    if (!session) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        },
        timestamp: new Date()
      }, { status: 404 });
    }
    
    // Remove player from session
    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found in session'
        },
        timestamp: new Date()
      }, { status: 404 });
    }
    
    const removedPlayer = session.players[playerIndex];
    session.players.splice(playerIndex, 1);
    session.updatedAt = new Date();
    
    // If GM left, end the session
    if (removedPlayer.isGM) {
      sessions.delete(sessionId);
      const code = Array.from(sessionsByCode.entries())
        .find(([_, id]) => id === sessionId)?.[0];
      if (code) {
        sessionsByCode.delete(code);
      }
      
      // Broadcast session ended
      broadcastToSession(sessionId, {
        type: 'session_ended',
        sessionId,
        data: { reason: 'GM left the session' },
        timestamp: new Date()
      });
    } else {
      // Broadcast player left
      broadcastToSession(sessionId, {
        type: 'player_left',
        sessionId,
        data: { playerId },
        timestamp: new Date()
      });
    }
    
    return json<ApiResponse>({
      success: true,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error removing player:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to remove player'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};