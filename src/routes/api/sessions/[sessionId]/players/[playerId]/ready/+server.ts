import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';
import { sessions, broadcastToSession } from '$lib/server/sessionStore';

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { sessionId, playerId } = params;
    const { ready } = await request.json();
    
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
    
    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found'
        },
        timestamp: new Date()
      }, { status: 404 });
    }
    
    // Update player ready status
    player.isReady = ready;
    session.updatedAt = new Date();
    
    // Broadcast player updated
    broadcastToSession(sessionId, {
      type: 'player_updated',
      sessionId,
      data: player,
      timestamp: new Date()
    });
    
    return json<ApiResponse>({
      success: true,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error updating ready status:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update ready status'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};