import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { 
  CreateSessionRequest, 
  ApiResponse
} from '$lib/types';

import { postgresSessionStore, initializePostgreSQLStore } from '$lib/server/postgresSessionStore';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Initialize PostgreSQL store if not already done
    await initializePostgreSQLStore();
    
    const body: CreateSessionRequest = await request.json();
    
    // Validate request
    if (!body.gmName?.trim() || !body.sessionName?.trim()) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'GM name and session name are required'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Use PostgreSQL session store to create session
    const result = await postgresSessionStore.createSession(body);
    
    if (!result.success) {
      return json<ApiResponse>(result, { status: 500 });
    }
    
    return json<ApiResponse>(result);
    
  } catch (error) {
    console.error('Error creating session:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error type');
    console.error('Environment DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.error('Environment vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
    
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Initialize PostgreSQL store if not already done
    await initializePostgreSQLStore();
    
    const code = url.searchParams.get('code');
    
    if (code) {
      // Get session by code
      const session = await postgresSessionStore.getSessionByCode(code.toUpperCase());
      if (!session) {
        return json<ApiResponse>({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Invalid session code'
          },
          timestamp: new Date()
        }, { status: 404 });
      }
      
      return json<ApiResponse>({
        success: true,
        data: session,
        timestamp: new Date()
      });
    }
    
    // Return all active sessions (for development)
    const activeSessions = await postgresSessionStore.getAllActiveSessions();
    return json<ApiResponse>({
      success: true,
      data: activeSessions,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch sessions'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};