# WebSocket Server Deployment Guide

This guide covers deploying the League Bingo WebSocket server to various free hosting platforms.

## Prerequisites

1. Built and tested locally with `npm run build`
2. Git repository pushed to GitHub/GitLab
3. Environment variables ready:
   - `API_URL` - Your SvelteKit app URL (e.g., `https://your-app.vercel.app`)
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `http://localhost:5173,https://your-app.vercel.app`)
   - `PORT` - Server port (default: 8080, most platforms override this)
   - `NODE_ENV` - Set to `production` for deployment

## Deployment Options

### 1. Railway.app (Recommended) ⭐

**Pros:**
- Excellent WebSocket support
- $5 free credit monthly
- Simple deployment
- Auto-scaling available
- Good performance

**Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`
4. Initialize project in ws-server directory:
   ```bash
   cd ws-server
   railway init
   ```
5. Set environment variables:
   ```bash
   railway variables set API_URL=https://your-sveltekit-app.vercel.app
   railway variables set ALLOWED_ORIGINS=https://your-sveltekit-app.vercel.app
   ```
6. Deploy:
   ```bash
   railway up
   ```
7. Get your WebSocket URL from Railway dashboard

### 2. Render.com

**Pros:**
- 750 hours free/month
- Good WebSocket support
- Auto-deploy from GitHub
- Built-in SSL

**Steps:**
1. Sign up at [render.com](https://render.com)
2. Create New > Web Service
3. Connect your GitHub repository
4. Select the `ws-server` directory as root
5. Use these settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add environment variables in dashboard:
   - `API_URL`
   - `ALLOWED_ORIGINS`
7. Deploy
8. Your WebSocket URL: `wss://your-service.onrender.com`

### 3. Fly.io

**Pros:**
- Global edge deployment
- Good performance
- WebSocket support
- Free tier includes 3 shared VMs

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up/login: `fly auth login`
3. Navigate to ws-server directory
4. Launch app:
   ```bash
   fly launch
   ```
5. Set secrets (environment variables):
   ```bash
   fly secrets set API_URL=https://your-sveltekit-app.vercel.app
   fly secrets set ALLOWED_ORIGINS=https://your-sveltekit-app.vercel.app
   ```
6. Deploy:
   ```bash
   fly deploy
   ```
7. Your WebSocket URL: `wss://your-app.fly.dev`

### 4. Heroku (Requires Credit Card)

**Note:** Free tier discontinued, but has a low-cost basic tier

**Steps:**
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Set buildpack: `heroku buildpacks:set heroku/nodejs`
4. Add environment variables:
   ```bash
   heroku config:set API_URL=https://your-sveltekit-app.vercel.app
   heroku config:set ALLOWED_ORIGINS=https://your-sveltekit-app.vercel.app
   ```
5. Deploy: `git push heroku main`

## Quick Deploy Commands

After initial setup, use these commands for updates:

```bash
# Railway
npm run deploy:railway

# Render (auto-deploys from GitHub)
git push origin main

# Fly.io
npm run deploy:fly
```

## Updating Your SvelteKit App

Once deployed, update your SvelteKit app's environment variable:

1. Create/update `.env.production` file:
   ```env
   VITE_WS_URL=wss://your-websocket-server.railway.app
   ```

2. For Vercel deployment, add the environment variable in Vercel dashboard:
   - Name: `VITE_WS_URL`
   - Value: Your WebSocket server URL (e.g., `wss://your-app.railway.app`)

3. Redeploy your SvelteKit app

## Testing Your Deployment

Test your WebSocket connection:

```bash
# Install wscat if you haven't
npm install -g wscat

# Test connection (replace with your actual URL)
wscat -c "wss://your-server.railway.app?sessionId=test&playerId=test"
```

## Monitoring

All platforms provide monitoring dashboards. Check:
- Connection count
- Memory usage
- Error logs
- Request/response times

## Troubleshooting

### Connection Issues
1. Check CORS settings - ensure `ALLOWED_ORIGINS` includes your frontend URL
2. Verify WebSocket URL uses `wss://` for HTTPS sites
3. Check browser console for specific errors

### Railway Specific
- Use `railway logs` to see real-time logs
- Check Railway dashboard for deployment status

### Render Specific
- Services may sleep after 15 minutes of inactivity on free tier
- First connection may take 30-60 seconds to wake up

### Fly.io Specific
- Use `fly logs` to see real-time logs
- Scale with `fly scale count 1` if needed

## Security Notes

1. Always use environment variables for sensitive data
2. Set appropriate CORS origins
3. Use `wss://` (secure WebSocket) in production
4. Consider adding rate limiting for production use
5. Monitor for unusual connection patterns

## Cost Optimization

- **Railway**: $5 credit covers ~500 hours/month
- **Render**: 750 free hours/month (enough for 24/7 operation)
- **Fly.io**: 3 shared VMs free, auto-scales to zero when idle

Choose based on your expected traffic and uptime requirements.