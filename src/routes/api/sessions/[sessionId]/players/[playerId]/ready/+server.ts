import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';
import { postgresSessionStore, initializePostgreSQLStore } from '$lib/server/postgresSessionStore';
import { broadcastToSession } from '$lib/server/sessionStore';

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    // Initialize PostgreSQL store if not already done
    await initializePostgreSQLStore();
    
    const { sessionId, playerId } = params;
    const { ready } = await request.json();
    
    // Validate input
    if (typeof ready !== 'boolean') {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ready status must be a boolean'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Use PostgreSQL session store to update ready status
    const result = await postgresSessionStore.updatePlayerReady(sessionId, playerId, ready);
    
    if (!result.success) {
      const status = result.error?.code === 'PLAYER_NOT_FOUND' ? 404 : 500;
      return json<ApiResponse>(result, { status });
    }
    
    // Broadcast player ready status change to WebSocket clients
    await broadcastToSession(sessionId, {
      type: 'player_updated',
      sessionId: sessionId,
      data: {
        playerId: playerId,
        isReady: ready
      },
      timestamp: new Date()
    });
    
    return json<ApiResponse>(result);
    
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