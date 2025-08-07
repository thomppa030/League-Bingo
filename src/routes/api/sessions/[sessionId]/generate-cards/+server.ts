import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';
import { sessions, broadcastToSession } from '$lib/server/sessionStore';
import { BingoCardGenerator } from '$lib/services/BingoCardGenerator';

const cardGenerator = new BingoCardGenerator();

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

    // Check if all players have selected categories
    const playersWithoutCategories = session.players.filter(
      p => p.selectedCategories.length === 0
    );
    
    if (playersWithoutCategories.length > 0) {
      return json<ApiResponse>({
        success: false,
        error: {
          code: 'CATEGORIES_NOT_SELECTED',
          message: 'All players must select categories before generating cards'
        },
        timestamp: new Date()
      }, { status: 400 });
    }

    // Generate cards for all players
    const playerData = session.players.map(p => ({
      id: p.id,
      role: p.role,
      selectedCategories: p.selectedCategories
    }));

    const cards = await cardGenerator.generateCardsForSession(sessionId, playerData);
    
    // Validate all cards
    for (const card of cards) {
      if (!cardGenerator.validateCard(card)) {
        throw new Error(`Invalid card generated for player ${card.playerID}`);
      }
    }

    // Update session with generated cards
    session.cards = cards;
    session.status = 'card_generation';
    session.updatedAt = new Date();

    // Broadcast cards generated event
    broadcastToSession(sessionId, {
      type: 'cards_generated',
      sessionId,
      data: cards, // Send the full cards array
      timestamp: new Date()
    });

    return json<ApiResponse<typeof cards>>({
      success: true,
      data: cards,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error generating cards:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate bingo cards'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};