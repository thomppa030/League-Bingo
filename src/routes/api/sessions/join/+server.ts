import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { 
  JoinSessionRequest, 
  ApiResponse
} from '$lib/types';
import { postgresSessionStore, initializePostgreSQLStore } from '$lib/server/postgresSessionStore';
import { broadcastToSession } from '$lib/server/sessionStore';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Initialize PostgreSQL store if not already done
    await initializePostgreSQLStore();
    
    const body: JoinSessionRequest = await request.json();
    
    // Validate request
    if (!body.code?.trim() || !body.playerName?.trim() || !body.role) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session code, player name, and role are required'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Use PostgreSQL session store to join session
    const result = await postgresSessionStore.joinSession(body);
    
    if (!result.success) {
      return json<ApiResponse>(result, { status: result.error?.code === 'SESSION_NOT_FOUND' ? 404 : 400 });
    }
    
    // Broadcast player joined event to WebSocket clients
    if (result.success && result.data && typeof result.data === 'object' && 'session' in result.data && 'player' in result.data) {
      const { session, player } = result.data as any;
      await broadcastToSession(session.id, {
        type: 'player_joined',
        sessionId: session.id,
        data: player, // Send player data directly as the client expects it
        timestamp: new Date()
      });
    }
    
    return json<ApiResponse>(result);
    
  } catch (error) {
    console.error('Error joining session:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to join session'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};