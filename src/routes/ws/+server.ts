import type { RequestHandler } from './$types';

// WebSocket endpoint placeholder - actual WebSocket server runs separately on port 8080
export const GET: RequestHandler = async ({ request }) => {
  return new Response('WebSocket server running on port 8080 - use ws://localhost:8080 for connections', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};