# Deployment Guide

## Frontend (Vercel)

1. **Connect Repository**
   - Go to vercel.com and import your repository
   - Select the root directory

2. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com
   ```

3. **Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Backend (Render)

1. **Create Web Service**
   - Connect your repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secure-jwt-secret
   CORS_ORIGIN=https://your-frontend.vercel.app
   DATABASE_URL=postgresql://user:pass@host:port/db
   REDIS_URL=redis://user:pass@host:port
   ```

3. **Add PostgreSQL Database**
   - Create PostgreSQL database in Render
   - Copy connection string to DATABASE_URL

4. **Add Redis (Optional)**
   - Create Redis instance in Render
   - Copy connection string to REDIS_URL

## Post-Deployment

1. Update URLs in configuration files
2. Test API endpoints
3. Verify CORS settings
4. Check database connections