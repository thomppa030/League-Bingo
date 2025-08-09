import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionStore } from '$lib/server/sessionStore';
import type { SessionStatus } from '$lib/types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { sessionId } = params;
  const { status } = await request.json() as { status: SessionStatus };

  const session = sessionStore.getSession(sessionId);
  
  if (!session) {
    return json({ error: 'Session not found' }, { status: 404 });
  }

  // Update session status
  session.status = status;
  sessionStore.updateSession(sessionId, session);

  // Broadcast status change to all connected clients via WebSocket
  // This will be handled by the WebSocket server watching for session updates
  
  return json({ success: true, session });
};