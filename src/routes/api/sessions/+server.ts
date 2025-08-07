import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  Role,
  SessionStatus
} from '$lib/types';
import type { 
  Session, 
  CreateSessionRequest, 
  ApiResponse,
  Player,
  Category
} from '$lib/types';

import { sessions, sessionsByCode } from '$lib/server/sessionStore';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  
  // Ensure unique code
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (sessionsByCode.has(code));
  
  return code;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
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
    
    // Create session
    const sessionId = generateId('session');
    const playerId = generateId('player');
    const code = generateSessionCode();
    
    const gmPlayer: Player = {
      id: playerId,
      sessionId,
      name: body.gmName.trim(),
      role: Role.MID, // Default role for GM
      selectedCategories: [],
      isGM: true,
      isReady: true, // GM is always ready
      joinedAt: new Date(),
      connectionStatus: 'connected',
      totalScore: 0
    };
    
    const session: Session = {
      id: sessionId,
      code,
      gmId: playerId,
      name: body.sessionName.trim(),
      status: SessionStatus.SETUP,
      settings: {
        allowLateJoin: body.settings?.allowLateJoin ?? true,
        requireGMConfirmation: body.settings?.requireGMConfirmation ?? true,
        enablePatternBonuses: body.settings?.enablePatternBonuses ?? true,
        customRules: body.settings?.customRules ?? [],
        timeLimit: body.settings?.timeLimit
      },
      players: [gmPlayer],
      cards: [],
      createAt: new Date(),
      updatedAt: new Date(),
      maxPlayers: body.maxPlayers ?? 8,
      minPlayers: body.minPlayers ?? 1
    };
    
    // Store session
    sessions.set(sessionId, session);
    sessionsByCode.set(code, sessionId);
    
    return json<ApiResponse<Session>>({
      success: true,
      data: session,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create session'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');
    
    if (code) {
      // Get session by code
      const sessionId = sessionsByCode.get(code.toUpperCase());
      if (!sessionId) {
        return json<ApiResponse>({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Invalid session code'
          },
          timestamp: new Date()
        }, { status: 404 });
      }
      
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
    }
    
    // Return all sessions (for development)
    return json<ApiResponse<Session[]>>({
      success: true,
      data: Array.from(sessions.values()),
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