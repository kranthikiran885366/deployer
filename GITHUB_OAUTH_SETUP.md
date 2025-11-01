# GitHub OAuth Setup Guide

## Step 1: Create GitHub OAuth Application

### Go to GitHub Developer Settings
1. Open https://github.com/settings/developers
2. Click **"New OAuth App"** button

### Fill in the Application Details

#### Application name
```
devoper
```
(This is what users will see when authorizing)

#### Homepage URL
```
http://localhost:3000
```
(The URL to your application's homepage)

#### Application description (Optional)
```
CloudDeck - A complete deployment and management platform with integrated OAuth authentication
```
(Displayed to users)

#### Authorization callback URL
```
http://localhost:5000/auth/github/callback
```
**IMPORTANT**: This must be exactly `http://localhost:5000/auth/github/callback`
(This is where GitHub redirects after user authorizes)

#### Enable Device Flow (Optional)
Leave unchecked for now (not needed for web app OAuth)

### Click "Create OAuth App"

---

## Step 2: Copy Credentials

After creating the app, you'll see:

1. **Client ID** - Copy this value
2. **Client Secret** - Click "Generate a new client secret" and copy it

Example values (do NOT use these):
- Client ID: `abc123def456ghi789`
- Client Secret: `ghp_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r`

---

## Step 3: Add to server/.env

Update your `server/.env` file with the GitHub credentials:

```env
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

### Example:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://kranthi:kranthi@1234@cluster0.ycbgnbj.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID_HERE
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET_HERE
```

---

## Step 4: Restart Backend Server

After updating `.env`, restart your backend:

1. Stop the running backend (Ctrl+C in terminal)
2. Run: `cd server && node index.js`
3. Wait for "Server running on port 5000"

---

## Step 5: Test GitHub OAuth

1. Go to http://localhost:3000/login
2. Click the **GitHub** button
3. You'll be redirected to GitHub login
4. Sign in with your GitHub account
5. Click "Authorize devoper"
6. You'll be redirected back to your app and logged in!

---

## GitHub OAuth Flow Diagram

```
User clicks "GitHub" button on Login Page
        ↓
Frontend: apiClient.startGitHubOAuth()
        ↓
Browser redirects to: http://localhost:5000/auth/github
        ↓
Backend Passport initiates GitHub OAuth
        ↓
Browser redirects to: https://github.com/login/oauth/authorize?...
        ↓
User logs in with GitHub credentials
        ↓
GitHub asks user to authorize "devoper" app
        ↓
User clicks "Authorize devoper"
        ↓
GitHub redirects to: http://localhost:5000/auth/github/callback?code=...
        ↓
Backend receives OAuth code
        ↓
Backend exchanges code for access token
        ↓
Backend fetches user profile from GitHub
        ↓
Backend creates/updates user in MongoDB with:
{
  email: user@github.com,
  name: "GitHub Username",
  avatar: "profile_pic_url",
  oauth: {
    github: {
      id: "123456789",
      login: "github-username",
      avatar_url: "profile_pic_url",
      accessToken: "gho_16C7e42F292c6912E7710c838347Ae178B4a"
    }
  }
}
        ↓
Backend generates JWT tokens
        ↓
Backend redirects to:
http://localhost:3000/auth/callback?token=JWT&refreshToken=...&email=...&name=...
        ↓
Frontend extracts tokens and stores in localStorage
        ↓
Frontend redirects to /dashboard
        ↓
User is logged in with GitHub! ✓
```

---

## What GitHub OAuth Provides

When user authorizes, you get:
- **GitHub ID**: Unique identifier
- **Login/Username**: User's GitHub username
- **Email**: User's GitHub email (if public or shared)
- **Avatar URL**: Link to user's profile picture
- **Access Token**: For making API calls on user's behalf

---

## Security Notes

1. **Never share Client Secret** - Keep it in `.env` only
2. **Use HTTPS in production** - GitHub requires https:// for callback URLs in production
3. **Change Client Secret if compromised** - GitHub allows regeneration
4. **Scopes** - Default scope is `user:email` for basic profile access

---

## Troubleshooting

### "Invalid OAuth application" error
- Check Client ID and Client Secret are correct
- Check Authorization callback URL is set to `http://localhost:5000/auth/github/callback`
- Restart backend after updating .env

### "Redirect URI mismatch" error
- Verify Authorization callback URL in GitHub settings is exactly:
  `http://localhost:5000/auth/github/callback`
- No trailing slash, exact match required

### "User not authorized" error
- Check you're not already logged in with same email
- Try incognito/private window
- Clear cookies and try again

### Can't see GitHub button on login page
- Restart frontend: `pnpm dev` from project root
- Clear browser cache
- Check frontend is actually running on http://localhost:3000

---

## Production Deployment

For production, update settings:

1. **Homepage URL**: `https://yourdomain.com`
2. **Authorization callback URL**: `https://yourdomain.com/auth/github/callback`
3. Update `.env`:
   ```env
   CLIENT_URL=https://yourdomain.com
   GITHUB_CLIENT_ID=your-production-client-id
   GITHUB_CLIENT_SECRET=your-production-client-secret
   ```
4. Test OAuth flow on production domain

---

## Files Modified

- `server/.env` - Added GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- `server/config/passport.js` - GitHub strategy already configured
- `server/routes/auth.js` - GitHub OAuth endpoints already implemented
- `lib/api-client.js` - startGitHubOAuth() method already implemented
- `app/login/page.jsx` - GitHub button already in UI
- `app/login/signup/page.jsx` - GitHub button already in UI

All backend and frontend code is already ready! Just add credentials and test.

---

## Quick Reference

| Item | Value |
|------|-------|
| OAuth Provider | GitHub |
| App Name | devoper |
| Backend Endpoint | http://localhost:5000/auth/github |
| Callback URL | http://localhost:5000/auth/github/callback |
| Frontend Login Page | http://localhost:3000/login |
| Scope | user:email |
| Token Type | OAuth 2.0 |

---

## Next Steps

1. ✅ Create GitHub OAuth App (you'll do this now)
2. ✅ Copy Client ID and Client Secret
3. ✅ Add to server/.env
4. ✅ Restart backend server
5. ✅ Test GitHub button on http://localhost:3000/login
6. ✅ Login with your GitHub account
7. ✅ Verify redirect to dashboard

Done! 🚀
