import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  ErrorCode
} from '$lib/types';
import type { 
  Session, 
  JoinSessionRequest, 
  ApiResponse,
  Player
} from '$lib/types';
import { sessions, sessionsByCode, sessionStore, broadcastToSession } from '$lib/server/sessionStore';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: JoinSessionRequest = await request.json();
    
    // Validate request
    if (!body.code?.trim() || !body.playerName?.trim()) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session code and player name are required'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Find session by code with detailed logging
    const code = body.code.trim().toUpperCase();
    console.log(`[Join] Looking for session with code: ${code}`);
    
    const sessionId = sessionsByCode.get(code);
    if (!sessionId) {
      console.log(`[Join] Code ${code} not found in sessionsByCode map`);
      console.log(`[Join] Available codes:`, Array.from(sessionsByCode.keys()));
      console.log(`[Join] Session consistency check:`, sessionStore.verifySessionConsistency());
      
      return json<ApiResponse>({
        success: false,
        error: {
          code: ErrorCode.INVALID_SESSION_CODE,
          message: 'Invalid session code'
        },
        timestamp: new Date()
      }, { status: 404 });
    }
    
    console.log(`[Join] Found sessionId ${sessionId} for code ${code}`);
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      console.log(`[Join] Session ${sessionId} not found in sessions map`);
      console.log(`[Join] Session consistency check:`, sessionStore.verifySessionConsistency());
      
      return json<ApiResponse>({
        success: false,
        error: {
          code: ErrorCode.SESSION_NOT_FOUND,
          message: 'Session not found'
        },
        timestamp: new Date()
      }, { status: 404 });
    }
    
    console.log(`[Join] Successfully found session ${sessionId} with ${session.players.length} players`);
    
    // Check if game already started and late join is disabled
    if (session.status !== 'setup' && !session.settings.allowLateJoin) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: ErrorCode.GAME_ALREADY_STARTED,
          message: 'Game has already started and late join is disabled'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Check if session is full
    if (session.players.length >= session.maxPlayers) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: ErrorCode.SESSION_FULL,
          message: 'Session is full'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Check for duplicate player name
    const duplicateName = session.players.some(
      p => p.name.toLowerCase() === body.playerName.trim().toLowerCase()
    );
    if (duplicateName) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: ErrorCode.DUPLICATE_PLAYER_NAME,
          message: 'A player with that name already exists in this session'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Create new player
    const playerId = generateId('player');
    const newPlayer: Player = {
      id: playerId,
      sessionId: session.id,
      name: body.playerName.trim(),
      role: body.role,
      selectedCategories: [],
      isGM: false,
      isReady: false,
      joinedAt: new Date(),
      connectionStatus: 'connected',
      totalScore: 0
    };
    
    // Add player to session
    session.players.push(newPlayer);
    session.updatedAt = new Date();
    
    // Update session in store with logging
    sessionStore.joinSession(sessionId, session);
    
    // Verify player was added successfully
    const updatedSession = sessionStore.getSession(sessionId);
    if (!updatedSession || !updatedSession.players.find(p => p.id === playerId)) {
      console.error('[Join] Failed to add player to session after join!');
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to add player to session'
        },
        timestamp: new Date()
      }, { status: 500 });
    }
    
    console.log(`[Join] Player ${newPlayer.name} (${playerId}) successfully added to session ${sessionId}`);
    
    // Broadcast player joined event via WebSocket
    broadcastToSession(sessionId, {
      type: 'player_joined',
      sessionId: sessionId,
      data: newPlayer,
      timestamp: new Date()
    });
    
    return json<ApiResponse<{ session: Session; player: Player }>>({
      success: true,
      data: { session: updatedSession, player: newPlayer },
      timestamp: new Date()
    });
    
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