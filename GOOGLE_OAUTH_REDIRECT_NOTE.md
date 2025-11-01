# Google OAuth Configuration Update Needed

## Issue
The Google OAuth credentials were created with redirect URI pointing to `http://localhost:3000/auth/google/callback` (frontend), but our backend OAuth callback is at `http://localhost:5000/auth/google/callback`.

## Solution
You need to update your Google OAuth app settings:

### In Google Cloud Console:

1. Go to https://console.cloud.google.com/
2. Select the project "theta-index-441923-e7"
3. Go to Credentials
4. Find your OAuth 2.0 Client ID: "<your-google-client-id>"
5. Click Edit
6. Update "Authorized redirect URIs" to include:
   - `http://localhost:3000` (JavaScript origins)
   - `http://localhost:5000` (API origins)
   - **`http://localhost:5000/auth/google/callback`** (Main OAuth callback)

7. Update "Authorized JavaScript origins" to include:
   - `http://localhost:3000`
   - `http://localhost:5000`

8. Click Save

## Why This Matters

- **Frontend** (`http://localhost:3000`): Next.js app that hosts the login/signup pages
- **Backend** (`http://localhost:5000`): Express.js API that handles OAuth authentication
  - Google OAuth flow: Frontend → Google → Backend (`/auth/google/callback`) → Frontend (`/auth/callback`)
  - Backend extracts tokens and redirects to frontend with tokens in URL
  - Frontend stores tokens in localStorage and completes login

## Current Configuration

```env
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

These are now configured in `server/.env` and ready to use once the redirect URI is updated in Google Console.
