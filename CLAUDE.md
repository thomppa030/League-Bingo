# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

League Bingo is a real-time multiplayer bingo game for League of Legends, built with SvelteKit and WebSockets. The project consists of two main components:

1. **Main Application** - SvelteKit web app for the game interface
2. **WebSocket Server** - Separate Node.js server for real-time communication

## Development Commands

### Main Application
```bash
# Development
npm run dev          # Start development server
npm run dev -- --open # Start dev server and open browser

# Type Checking
npm run check        # Type check the project
npm run check:watch  # Type check with watch mode

# Building
npm run build        # Build production version
npm run preview      # Preview production build
```

### WebSocket Server
```bash
cd ws-server

# Development
npm run dev          # Start WebSocket dev server (uses tsx watch)

# Production
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production server
```

## Architecture

### Key Technologies
- **Frontend**: SvelteKit, Svelte 5, TypeScript, Vite
- **Database**: PostgreSQL with Deno 2 for persistence and real-time notifications
- **Backend**: Node.js WebSocket server with TypeScript
- **Real-time**: WebSockets + PostgreSQL LISTEN/NOTIFY for bidirectional communication
- **Data Source**: Google Sheets integration for challenge data

### Project Structure
- `/src/routes/` - SvelteKit pages and API endpoints
- `/src/lib/` - Shared components, stores, and utilities
- `/database/` - PostgreSQL schema, models, and Deno 2 database layer
- `/ws-server/` - Standalone WebSocket server
- `GOOGLE_SHEETS_SETUP.md` - Instructions for Google Sheets CMS setup
- `WEBSOCKETS.md` - WebSocket implementation details

### WebSocket Integration
The WebSocket server runs separately from the SvelteKit app:
- Development: `ws://localhost:8080`
- Production: Configure `VITE_WS_URL` environment variable
- Connections authenticated via session/player validation

### Environment Variables
Main app uses `.env` with:
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_WS_URL` - WebSocket server URL
- Google Sheets configuration (API key, sheet ID, range)

WebSocket server uses `.env` with:
- `PORT` - Server port (default: 8080)
- `API_URL` - SvelteKit API URL for validation
- `ALLOWED_ORIGINS` - CORS allowed origins

### Database Setup
The application now uses PostgreSQL for persistent storage:

1. **Install PostgreSQL** (local development)
2. **Create database**: `createdb league_bingo`
3. **Set environment variables** (copy `.env.example` to `.env`)
4. **Run schema**: `psql $DATABASE_URL -f database/schema.sql`
5. **Run migrations**: `deno run --allow-net --allow-env --allow-read database/migrate.ts`

### Database Architecture
- **Deno 2** for database operations with modern JavaScript/TypeScript
- **Connection pooling** for efficient database usage
- **ACID transactions** for data consistency
- **PostgreSQL LISTEN/NOTIFY** for real-time updates
- **Foreign key constraints** for data integrity

## Testing and Debugging

### WebSocket Testing
```bash
# Install wscat globally
npm install -g wscat

# Test connection
wscat -c "ws://localhost:8080?sessionId=XXX&playerId=YYY"
```

### Database Commands
```bash
# Database migration and setup
deno run --allow-net --allow-env --allow-read database/migrate.ts

# Direct database access
psql $DATABASE_URL

# Load initial schema
psql $DATABASE_URL -f database/schema.sql
```

### Running Both Servers
For full development, run both servers in separate terminals:
1. Terminal 1: `npm run dev` (main app)
2. Terminal 2: `cd ws-server && npm run dev` (WebSocket server)

**Note**: Database operations use Deno 2, while the main app uses Node.js. This hybrid approach leverages Deno's modern features for database operations while maintaining compatibility with the existing SvelteKit/Node.js ecosystem.