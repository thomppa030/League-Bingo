import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse, Session } from '$lib/types';
import { sessions } from '$lib/server/sessionStore';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { sessionId } = params;
    
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