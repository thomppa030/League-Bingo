import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { 
  JoinSessionRequest, 
  ApiResponse
} from '$lib/types';
import { postgresSessionStore, initializePostgreSQLStore } from '$lib/server/postgresSessionStore';

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