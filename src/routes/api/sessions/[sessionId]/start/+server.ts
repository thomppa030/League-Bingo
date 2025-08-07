import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SessionStatus } from '$lib/types';
import type { ApiResponse } from '$lib/types';
import { sessions, broadcastToSession } from '$lib/server/sessionStore';

export const POST: RequestHandler = async ({ params }) => {
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

    // Check if cards have been generated
    if (!session.cards || session.cards.length === 0) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'CARDS_NOT_GENERATED',
          message: 'Cards must be generated before starting the game'
        },
        timestamp: new Date()
      }, { status: 400 });
    }

    // Check if we have cards for all players
    if (session.cards.length !== session.players.length) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'INCOMPLETE_CARDS',
          message: 'Not all players have generated cards'
        },
        timestamp: new Date()
      }, { status: 400 });
    }

    // Update session status to playing
    session.status = SessionStatus.PLAYING;
    session.updatedAt = new Date();

    // Broadcast game started event
    broadcastToSession(sessionId, {
      type: 'game_started',
      sessionId,
      data: {
        startedAt: new Date(),
        playerCount: session.players.length,
        cardsGenerated: session.cards.length
      },
      timestamp: new Date()
    });

    return json<ApiResponse<{ status: string }>>({
      success: true,
      data: { status: 'playing' },
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error starting game:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to start game'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};