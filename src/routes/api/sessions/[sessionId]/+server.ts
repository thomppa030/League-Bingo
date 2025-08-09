import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse, Session } from '$lib/types';
import { postgresSessionStore, initializePostgreSQLStore } from '$lib/server/postgresSessionStore';

export const GET: RequestHandler = async ({ params }) => {
  try {
    // Initialize PostgreSQL store if not already done
    await initializePostgreSQLStore();
    
    const { sessionId } = params;
    
    const session = await postgresSessionStore.getSessionById(sessionId);
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
    
    return json<ApiResponse<Session>>({
      success: true,
      data: session,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch session'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};