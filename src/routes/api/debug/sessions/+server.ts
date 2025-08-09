import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionStore } from '$lib/server/sessionStore';

export const GET: RequestHandler = async () => {
  try {
    const sessions = sessionStore.getAllSessions();
    const log = sessionStore.getSessionLog();
    const consistency = sessionStore.verifySessionConsistency();
    
    return json({
      success: true,
      data: {
        totalSessions: sessions.length,
        sessions: sessions.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          status: s.status,
          playerCount: s.players.length,
          players: s.players.map(p => ({
            id: p.id,
            name: p.name,
            isGM: p.isGM,
            isReady: p.isReady
          })),
          createdAt: s.createAt,
          updatedAt: s.updatedAt
        })),
        recentActions: log.slice(-10),
        consistency
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching session debug info:', error);
    return json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch session debug info'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};