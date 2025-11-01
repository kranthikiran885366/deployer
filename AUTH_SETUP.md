# Complete Authentication Setup Guide

This guide walks you through setting up email/password authentication and OAuth (Google & GitHub) for CloudDeck.

## 1. Email/Password Authentication (Already Configured ✓)

The email/password authentication is fully configured and ready to use:

- **Signup**: POST `/auth/signup` with email, password, name
- **Login**: POST `/auth/login` with email, password
- **Logout**: POST `/auth/logout` (requires auth token)
- **Change Password**: POST `/auth/change-password`
- **Forgot Password**: POST `/auth/forgot-password`
- **Reset Password**: POST `/auth/reset-password`

### Testing Email/Password Auth

1. Go to http://localhost:3000/signup
2. Create an account with email and password
3. You'll be redirected to `/auth/callback` which processes the tokens
4. Then redirected to `/dashboard`

## 2. Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the Google+ API:
   - Search for "Google+ API"
   - Click Enable

### Step 2: Create OAuth 2.0 Credentials

1. Go to Credentials (left sidebar)
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5000`
5. Add Authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
6. Copy the Client ID and Client Secret

### Step 3: Add to .env

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 3. GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to GitHub Settings → [Developer settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the form:
   - **Application name**: CloudDeck
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:5000/auth/github/callback

### Step 2: Copy Credentials

1. Copy the Client ID and generate a new Client Secret
2. Save these values

### Step 3: Add to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 4. Running the Application

### Frontend

```bash
# From project root
pnpm dev
# or
npm run dev
```

Frontend will run on http://localhost:3000

### Backend

```bash
# From project root
cd server
pnpm dev
# or
npm run dev
```

Backend will run on http://localhost:5000

## 5. Testing OAuth Flows

### Google OAuth

1. Go to http://localhost:3000/login
2. Click "Google" button
3. Sign in with your Google account
4. You'll be redirected to the callback page
5. Tokens are extracted and stored in localStorage
6. Redirected to /dashboard

### GitHub OAuth

1. Go to http://localhost:3000/login
2. Click "GitHub" button
3. Authorize the OAuth app
4. You'll be redirected to the callback page
5. Tokens are extracted and stored in localStorage
6. Redirected to /dashboard

## 6. OAuth Flow Diagram

```
User clicks "Google" button
        ↓
app.startGoogleOAuth()
        ↓
Redirects to http://localhost:5000/auth/google
        ↓
Passport initiates Google OAuth flow
        ↓
User logs in with Google
        ↓
Google redirects to http://localhost:5000/auth/google/callback
        ↓
Server verifies credentials
        ↓
Server creates/updates user in MongoDB
        ↓
Server generates JWT tokens
        ↓
Server redirects to:
http://localhost:3000/auth/callback?token=...&refreshToken=...
        ↓
Frontend callback page extracts tokens from URL
        ↓
Tokens stored in localStorage
        ↓
User redirected to /dashboard
        ↓
User authenticated and logged in ✓
```

## 7. Frontend Integration

The frontend has the following auth pages:

- **Login**: `/login` - Email/password and OAuth buttons
- **Signup**: `/signup` - Create new account or OAuth
- **Auth Callback**: `/auth/callback` - Handles OAuth redirects
- **Auth Error**: `/auth/error` - Displays auth errors

### API Client Methods

```javascript
// Email/Password
await apiClient.login(email, password)
await apiClient.signup(email, password, confirmPassword, name)
await apiClient.logout()

// OAuth (redirects user)
apiClient.startGoogleOAuth()
apiClient.startGitHubOAuth()

// Token Management
apiClient.setToken(token)
apiClient.setRefreshToken(refreshToken)
apiClient.refreshAccessToken()
apiClient.clearTokens()

// User
await apiClient.getCurrentUser()
await apiClient.updateProfile(name, avatar)
```

## 8. Environment Variables Summary

```bash
# Backend (.env in server/)
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Frontend (.env.local or next.config.js)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 9. Production Deployment

When deploying to production:

1. Update CLIENT_URL and API_URL to your production domain
2. Add production OAuth redirect URIs in Google/GitHub settings
3. Use a strong JWT_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
4. Update MONGODB_URI to production database
5. Set NODE_ENV=production
6. Configure CORS properly in production

## 10. Troubleshooting

### "Module not found: Can't resolve '@/components/ui/dropdown-menu'"

If you see this error, install missing UI components:

```bash
npm install
# or
pnpm install
```

### OAuth redirects to error page

1. Check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET are set
2. Check that redirect URIs are configured in Google/GitHub settings
3. Check SERVER logs for specific errors
4. Verify CLIENT_URL is correct in .env

### "Invalid token" when accessing protected routes

1. Make sure JWT_SECRET is set in .env
2. Make sure token is included in Authorization header
3. Check that token hasn't expired (7 days default)
4. Use refreshAccessToken() to get a new token

### Can't connect to MongoDB

1. Check MONGODB_URI is correct
2. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)
3. Check username and password in URI
4. Run locally if remote connection fails

## Next Steps

1. Configure Google OAuth credentials
2. Configure GitHub OAuth credentials
3. Update server/.env with your credentials
4. Start backend and frontend
5. Test all auth flows
6. Implement additional auth features as needed (2FA, email verification, etc.)
