# SnapNote Vercel Deployment Guide

## Prerequisites
1. MongoDB Atlas account (for production database)
2. Vercel account
3. GitHub repository (already set up)

## Deployment Steps

### 1. Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel
5. Get your connection string

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/rv0-0/SnapNote`
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `npm run vercel-build`
   - Output Directory: `frontend/build`

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# Set up and deploy? Y
# Which scope? (your account)
# Link to existing project? N
# Project name: snapnote
# Directory: ./
# Override settings? Y
# Build Command: npm run vercel-build
# Output Directory: frontend/build
# Development Command: npm run dev
```

### 3. Configure Environment Variables in Vercel
Add these environment variables in your Vercel dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snapnote?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
NODE_ENV=production
```

### 4. Custom Domain (Optional)
1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain

## File Structure for Vercel
```
SnapNote/
├── package.json (root - for Vercel build)
├── vercel.json (Vercel configuration)
├── backend/
│   ├── api/
│   │   └── index.js (Vercel serverless function)
│   └── src/ (original backend code)
├── frontend/
│   ├── build/ (generated after build)
│   └── src/
└── .env.vercel.example (environment template)
```

## Important Notes
- The backend runs as a Vercel serverless function
- Frontend is served as static files
- Database connections are handled per request (serverless)
- CORS is configured for Vercel domains
- API routes are prefixed with `/api/`

## Troubleshooting
1. **Build fails**: Check that all dependencies are in the correct package.json files
2. **API not working**: Verify environment variables are set correctly
3. **Database connection issues**: Check MongoDB Atlas whitelist and connection string
4. **CORS errors**: Verify the frontend URL is added to CORS origins

## Local Development
```bash
# Install dependencies
npm run install-deps

# Run development server
npm run dev
```

## Production URLs
- Frontend: https://your-app-name.vercel.app
- API: https://your-app-name.vercel.app/api
- Health Check: https://your-app-name.vercel.app/api/health
