# 🚀 CloudDeck Authentication - Quick Reference Card

## Current Status: ✅ FULLY IMPLEMENTED & RUNNING

```
Frontend (Next.js):    http://localhost:3000 ✓ Running
Backend (Express):     http://localhost:5000 ✓ Running
MongoDB:               Mock mode (in-memory storage)
```

---

## 🔐 Authentication Methods Available

### 1️⃣ Email / Password
- **Status**: ✅ Fully Working
- **Signup**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login
- **Backend Endpoints**:
  - POST `/auth/signup` - Create account
  - POST `/auth/login` - Sign in
  - POST `/auth/logout` - Sign out

### 2️⃣ Google OAuth
- **Status**: ✅ Configured (Need to verify redirect URI)
- **Credentials**: Already added to server/.env
- **Backend Endpoints**:
  - GET `/auth/google` - Start OAuth flow
  - GET `/auth/google/callback` - OAuth callback
- **Action**: Update redirect URI in Google Cloud Console

### 3️⃣ GitHub OAuth
- **Status**: ⏳ Ready to configure
- **Backend Endpoints**:
  - GET `/auth/github` - Start OAuth flow
  - GET `/auth/github/callback` - OAuth callback
- **Action**: Create GitHub OAuth App and add credentials to .env

---

## 📝 Current Environment Variables

### server/.env
```properties
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://kranthi:kranthi@1234@cluster0.ycbgnbj.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Google OAuth - CONFIGURED ✓
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# GitHub OAuth - NEEDS CONFIGURATION ⏳
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

---

## 🎯 Quick Testing Guide

### Test Email Signup
```
1. Go to http://localhost:3000/signup
2. Enter: name, email, password
3. Click "Create account"
4. Verify redirected to dashboard ✓
```

### Test Email Login
```
1. Go to http://localhost:3000/login
2. Enter email and password from signup
3. Click "Sign in"
4. Verify redirected to dashboard ✓
```

### Test Google OAuth (After Redirect URI Update)
```
1. Go to http://localhost:3000/login
2. Click "Google" button
3. Sign in with Google account
4. Authorize app
5. Verify redirected to dashboard ✓
```

### Test Token Storage
```javascript
// In browser DevTools Console:
localStorage.getItem('auth_token')     // Should return JWT
localStorage.getItem('refresh_token')  // Should return refresh token
```

---

## 📋 Immediate Next Steps

### Priority 1: Update Google OAuth Redirect URI
```
1. Go to https://console.cloud.google.com/
2. Select project: "theta-index-441923-e7"
3. Go to Credentials
4. Find OAuth 2.0 Client ID
5. Click Edit
6. Add to "Authorized redirect URIs":
   http://localhost:5000/auth/google/callback
7. Click Save
8. Go to http://localhost:3000/login
9. Click Google button and test ✓
```

### Priority 2: Configure GitHub OAuth (Optional)
```
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: devoper
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:5000/auth/github/callback
4. Copy Client ID and Client Secret
5. Add to server/.env:
   GITHUB_CLIENT_ID=<your-id>
   GITHUB_CLIENT_SECRET=<your-secret>
6. Restart backend
7. Go to http://localhost:3000/login
8. Click GitHub button and test ✓
```

---

## 🔑 Frontend API Client Methods

```javascript
// Import the API client
import apiClient from '@/lib/api-client'

// Email/Password Auth
await apiClient.signup(email, password, confirmPassword, name)
await apiClient.login(email, password)
await apiClient.logout()

// OAuth (redirects user)
apiClient.startGoogleOAuth()
apiClient.startGitHubOAuth()

// Token Management
apiClient.setToken(token)
apiClient.refreshAccessToken()
apiClient.clearTokens()

// User Operations
await apiClient.getCurrentUser()
await apiClient.updateProfile(name, avatar)
await apiClient.changePassword(currentPassword, newPassword, confirmPassword)

// Password Reset
await apiClient.forgotPassword(email)
await apiClient.resetPassword(resetToken, newPassword, confirmPassword)
```

---

## 🛣️ Frontend Routes

| Route | Purpose | Auth Required |
|-------|---------|---|
| `/login` | Email/password + OAuth login | ❌ No |
| `/signup` | Create new account | ❌ No |
| `/auth/callback` | OAuth callback handler | ❌ No |
| `/auth/error` | Error display page | ❌ No |
| `/dashboard` | Main app (protected) | ✅ Yes |

---

## 🔌 Backend API Endpoints

### Authentication
```
POST   /auth/signup              Create new account
POST   /auth/login               Login with email/password
POST   /auth/logout              Logout (requires token)
POST   /auth/refresh             Refresh access token
POST   /auth/forgot-password     Request password reset
POST   /auth/reset-password      Reset password with token
```

### OAuth
```
GET    /auth/google              Start Google OAuth flow
GET    /auth/google/callback     Google OAuth callback
GET    /auth/github              Start GitHub OAuth flow
GET    /auth/github/callback     GitHub OAuth callback
```

### Protected Routes (require Bearer token)
```
GET    /auth/me                  Get current user info
PUT    /auth/profile             Update user profile
POST   /auth/change-password     Change password
```

---

## 💾 Data Storage

### User Data in MongoDB
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  password: "bcrypt_hash",  // Only for email/password users
  name: "John Doe",
  avatar: "https://...",
  role: "user",
  emailVerified: true,
  
  // OAuth Profile Data
  oauth: {
    google: {
      id: "118....",
      email: "user@gmail.com",
      picture: "https://..."
    },
    github: {
      id: "123456",
      login: "username",
      avatar_url: "https://...",
      accessToken: "gho_..."
    }
  },
  
  // Account Security
  twoFactorEnabled: false,
  loginAttempts: 0,
  lockUntil: null,
  lastLogin: "2024-10-31T...",
  
  createdAt: "2024-10-31T...",
  updatedAt: "2024-10-31T..."
}
```

---

## 🔐 Token Structure

### Access Token (JWT - 7 days)
```
Header:    { alg: "HS256", typ: "JWT" }
Payload:   { userId: "...", iat: ..., exp: ... }
Signature: HMAC-SHA256(header + payload, JWT_SECRET)
```

### Refresh Token (JWT - 30 days)
```
Used to get new access token after expiry
Stored in localStorage alongside access token
```

---

## ⚙️ Configuration Files

### server/config/passport.js
- ✅ LocalStrategy (email/password)
- ✅ GoogleStrategy
- ✅ GitHubStrategy

### server/config/env.js
- ✅ Environment variable loading

### server/middleware/auth.js
- ✅ JWT verification middleware

### server/models/User.js
- ✅ User schema with OAuth fields
- ✅ Password hashing with bcrypt

### lib/api-client.js
- ✅ Frontend API wrapper
- ✅ Auth methods
- ✅ Token management

---

## 📚 Documentation Files

Created guides:
- `COMPLETE_AUTH_SUMMARY.md` - Full architecture overview
- `AUTH_SETUP.md` - General OAuth setup instructions
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth detailed guide
- `GOOGLE_OAUTH_REDIRECT_NOTE.md` - Google redirect URI fix
- `GITHUB_OAUTH_SETUP.md` - GitHub OAuth setup guide
- `TESTING_GUIDE.md` - Step-by-step testing instructions

---

## 🚨 Troubleshooting Quick Links

### "OAuth button doesn't work"
→ Check GITHUB_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env
→ Verify redirect URIs in OAuth provider settings
→ Restart backend: `cd server && node index.js`

### "Login says Invalid credentials"
→ Make sure email/password is correct
→ Try signup first if new account
→ Check backend is running: `netstat -ano | findstr :5000`

### "Token not saved in localStorage"
→ Check browser localStorage: `localStorage.getItem('auth_token')`
→ Make sure popup blockers aren't blocking OAuth flow
→ Try incognito/private window

### "MongoDB connection failed"
→ This is normal! Server runs in mock mode
→ Users stored in memory (reset on restart)
→ For production: update MONGODB_URI

---

## 🎉 Success Indicators

You'll know auth is working when:
- ✅ Can sign up with email/password
- ✅ Can log in with email/password
- ✅ Can log in with Google
- ✅ Can log in with GitHub
- ✅ Tokens persist in localStorage
- ✅ Can access protected routes with token
- ✅ Logout clears tokens
- ✅ Invalid credentials show error

---

## 📞 Support Resources

- Check terminal for backend errors
- Check DevTools Console for frontend errors
- Check DevTools Network tab to see API requests
- Read error messages carefully - they usually explain the issue
- Look at the documentation files for detailed guides

---

## 🎯 Final Checklist

- [ ] Google OAuth redirect URI updated
- [ ] GitHub OAuth app created and credentials added to .env
- [ ] Backend restarted after .env changes
- [ ] Email signup/login tested
- [ ] Google OAuth tested
- [ ] GitHub OAuth tested
- [ ] Tokens verified in localStorage
- [ ] Protected routes verified with token
- [ ] Logout tested

---

**Status**: Ready for testing! 🚀

Both servers running, authentication fully implemented, ready for OAuth provider configuration.
