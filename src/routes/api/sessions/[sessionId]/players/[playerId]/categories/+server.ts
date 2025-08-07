import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';
import { Category } from '$lib/types';
import { sessions, broadcastToSession } from '$lib/server/sessionStore';

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { sessionId, playerId } = params;
    const { categories } = await request.json();
    
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
    
    // Validate categories
    if (!Array.isArray(categories) || categories.length === 0) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one category must be selected'
        },
        timestamp: new Date()
      }, { status: 400 });
    }
    
    // Update player categories
    player.selectedCategories = categories as Category[];
    player.isReady = true; // Auto-ready when categories are selected
    session.updatedAt = new Date();
    
    // If all players have selected categories, update session status
    const allPlayersReady = session.players.every(p => p.selectedCategories.length > 0);
    if (allPlayersReady && session.status === 'setup') {
      session.status = 'category_selection';
    }
    
    // Broadcast updates
    broadcastToSession(sessionId, {
      type: 'player_updated',
      sessionId,
      data: player,
      timestamp: new Date()
    });
    
    if (allPlayersReady) {
      broadcastToSession(sessionId, {
        type: 'categories_selected',
        sessionId,
        data: { allReady: true },
        timestamp: new Date()
      });
    }
    
    return json<ApiResponse>({
      success: true,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error updating categories:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update categories'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};