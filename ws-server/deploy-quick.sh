#!/bin/bash

# Quick deployment script for League Bingo WebSocket Server
# This script helps deploy to Railway.app with the correct settings

echo "🚀 League Bingo WebSocket Server Deployment"
echo "=========================================="
echo ""
echo "Frontend URL: https://league-bingo-eta.vercel.app"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "📝 Setting up Railway deployment..."
echo ""

# Login to Railway
echo "1️⃣ Logging in to Railway..."
railway login

# Initialize or link project
echo "2️⃣ Initializing Railway project..."
railway init

# Set environment variables
echo "3️⃣ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set API_URL=https://league-bingo-eta.vercel.app
railway variables set ALLOWED_ORIGINS=https://league-bingo-eta.vercel.app,http://localhost:5173,http://localhost:3000
railway variables set MAX_CONNECTIONS_PER_IP=10
railway variables set RATE_LIMIT_MESSAGES_PER_MINUTE=60

echo ""
echo "✅ Environment variables set!"
echo ""

# Deploy
echo "4️⃣ Deploying to Railway..."
railway up

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Railway dashboard to get your WebSocket URL"
echo "2. Update your Vercel environment variables:"
echo "   - Add VITE_WS_URL with your Railway WebSocket URL (wss://...)"
echo "3. Redeploy on Vercel to apply the changes"
echo ""
echo "Your WebSocket server will be available at: wss://[your-app].up.railway.app"