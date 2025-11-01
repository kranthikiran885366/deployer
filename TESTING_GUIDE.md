# Testing Guide - Step by Step

## ✅ Current Status

**Backend**: Running on http://localhost:5000
**Frontend**: Running on http://localhost:3000
**Servers**: Both connected and ready to test

---

## Test 1: Email/Password Signup

### Steps:
1. Open http://localhost:3000/signup in your browser
2. Fill in the form:
   - Full name: `John Doe`
   - Email: `john@example.com`
   - Password: `Password123`
   - Confirm password: `Password123`
3. Check the "I agree to the Terms of Service" checkbox
4. Click "Create account"

### Expected Result:
- Account created successfully
- Redirected to http://localhost:3000/auth/callback (loading page)
- Then redirected to http://localhost:3000/dashboard
- User is logged in ✓

### What Happened Behind Scenes:
```
1. Frontend sent POST to http://localhost:5000/auth/signup
2. Backend created user in database with bcrypt password hash
3. Backend generated JWT access token (7 days) and refresh token (30 days)
4. Frontend received tokens and stored in localStorage
5. Frontend extracted token from response and stored it
6. Redirected user to dashboard
```

---

## Test 2: Email/Password Login

### Steps:
1. Open http://localhost:3000/login
2. Fill in the form:
   - Email: `john@example.com`
   - Password: `Password123`
3. Click "Sign in"

### Expected Result:
- Login successful
- Redirected to dashboard
- User is logged in ✓

### What Happened Behind Scenes:
```
1. Frontend sent POST to http://localhost:5000/auth/login
2. Backend found user and compared password with bcrypt
3. Backend generated new JWT tokens
4. Frontend received tokens and stored in localStorage
5. Frontend was redirected to dashboard
```

---

## Test 3: Google OAuth Login

### Prerequisites:
1. Update Google OAuth redirect URI in Google Console:
   - Go to https://console.cloud.google.com/
   - Select project "theta-index-441923-e7"
   - Go to Credentials
   - Find OAuth 2.0 Client ID and click Edit
   - Add `http://localhost:5000/auth/google/callback` to "Authorized redirect URIs"
   - Click Save

### Steps:
1. Open http://localhost:3000/login
2. Click the **Google** button
3. You'll be redirected to Google login (if not already logged in)
4. Sign in with your Google account
5. Authorize the app to access your profile

### Expected Result:
- Redirected to http://localhost:3000/auth/callback
- Tokens are automatically extracted from URL
- Redirected to dashboard
- User is logged in with Google account ✓

### Flow Diagram:
```
Click "Google" on Login Page
        ↓
Frontend navigates to http://localhost:5000/auth/google
        ↓
Backend initiates Google OAuth flow via Passport
        ↓
Browser redirects to Google login
        ↓
User signs in and authorizes app
        ↓
Google redirects to http://localhost:5000/auth/google/callback
        ↓
Backend receives OAuth code and user profile from Google
        ↓
Backend creates/updates user in MongoDB
        ↓
Backend generates JWT tokens
        ↓
Backend redirects to:
http://localhost:3000/auth/callback?token=JWT_TOKEN&refreshToken=REFRESH_TOKEN&userId=...&email=...&name=...&avatar=...
        ↓
Frontend /auth/callback page extracts these URL params
        ↓
Frontend stores tokens in localStorage via apiClient.setToken()
        ↓
Frontend redirects to /dashboard
        ↓
User is logged in! ✓
```

### What Happened Behind Scenes:
```
1. Frontend navigated to backend OAuth endpoint
2. Passport intercepted and initiated Google OAuth flow
3. Google verified credentials and returned user profile + OAuth code
4. Backend looked up user by google.id in MongoDB
5. Backend created new user if not found (first time login)
6. Backend generated JWT tokens with user._id as payload
7. Backend redirected to frontend with tokens in URL
8. Frontend extracted tokens and stored in localStorage
9. Frontend set up authenticated session
```

---

## Test 4: Verify Token Storage

### Steps:
1. After logging in, open browser DevTools (F12)
2. Go to Console tab
3. Type and execute: `localStorage.getItem('auth_token')`
4. Type and execute: `localStorage.getItem('refresh_token')`

### Expected Result:
- Both commands return long JWT strings
- Tokens are valid and stored
- Tokens persist after page refresh

### Example:
```javascript
// Copy and paste into DevTools Console:
localStorage.getItem('auth_token')
// Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njc4...

localStorage.getItem('refresh_token')
// Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njc4...
```

---

## Test 5: Access Protected Routes

### Steps:
1. After login, you should be on dashboard
2. Try accessing `/auth/me` endpoint via curl or API client

### In Browser Console:
```javascript
// Test getting current user info
fetch('http://localhost:5000/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(console.log)
```

### Expected Result:
```javascript
{
  id: "667890abcdef123456789abc",
  email: "john@example.com",
  name: "John Doe",
  avatar: null,
  role: "user",
  emailVerified: true
}
```

### What Happened:
```
1. Frontend sent GET request to /auth/me
2. Included Authorization header with Bearer token
3. Backend authMiddleware verified JWT signature
4. Backend decoded token and set req.userId
5. Backend returned current user info
```

---

## Test 6: Logout

### Steps:
1. While logged in, open browser Console
2. Copy and run:
```javascript
fetch('http://localhost:5000/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(console.log)
```

### Expected Result:
```javascript
{ message: "Logout successful" }
```

### Verify Logout:
1. Check localStorage:
```javascript
localStorage.getItem('auth_token')  // Should return null
localStorage.getItem('refresh_token')  // Should return null
```

2. Try accessing protected route:
```javascript
fetch('http://localhost:5000/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
// Should return 401 Unauthorized
```

---

## Test 7: Error Handling

### Test Invalid Email/Password:
1. Go to http://localhost:3000/login
2. Enter wrong email or password
3. Click "Sign in"

### Expected Result:
- Error message displayed on page: "Invalid email or password"
- Page doesn't redirect

### Test Missing Credentials:
1. Go to http://localhost:3000/signup
2. Leave fields empty
3. Click "Create account"

### Expected Result:
- Error message: "Please fill in all fields"
- Page doesn't redirect

### Test Password Mismatch:
1. Go to http://localhost:3000/signup
2. Enter different passwords in Password and Confirm password
3. Click "Create account"

### Expected Result:
- Error message: "Passwords do not match"
- Page doesn't redirect

---

## Test 8: Token Refresh (Advanced)

### After 7 Days:
When access token expires, use refresh token to get new one:

```javascript
fetch('http://localhost:5000/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refresh_token')
  })
})
.then(r => r.json())
.then(data => {
  // Store new token
  localStorage.setItem('auth_token', data.token)
  console.log('Token refreshed!')
})
```

---

## Test 9: Check Server Logs

### Backend Logs:
In the terminal where backend is running, you should see:
```
POST /auth/login 200
POST /auth/google 302 (redirect)
POST /auth/google/callback 200
GET /auth/me 200
```

### Frontend Logs:
In browser Console, you may see API requests being made

---

## Troubleshooting

### "Invalid token" on protected routes
- Verify you just logged in (token is fresh)
- Check token is in localStorage: `localStorage.getItem('auth_token')`
- Verify backend is still running: `netstat -ano | findstr :5000`

### "Google button doesn't work"
- Check redirect URI is updated in Google Console
- Verify GOOGLE_CLIENT_ID is in server/.env
- Check backend is running: http://localhost:5000/health

### "Redirected to error page instead of dashboard"
- Check error message at http://localhost:3000/auth/error?message=...
- Look at backend terminal for error logs
- Check network tab in DevTools to see request/response

### "localStorage is empty after logout"
- This is correct! Tokens are cleared on logout
- Try logging in again to repopulate localStorage

### "MongoDB connection error"
- Server will fall back to mock mode (in-memory storage)
- Users are stored in memory, not persisted
- Restart server to reset users
- This is normal for local development

---

## Success Checklist

- [ ] Email signup works
- [ ] Email login works
- [ ] Google OAuth works (after redirect URI update)
- [ ] Tokens are stored in localStorage
- [ ] Logout clears tokens
- [ ] Protected routes require valid token
- [ ] Invalid credentials show error messages
- [ ] Redirect flows work correctly

---

## Next: Advanced Testing (Optional)

- Test with different OAuth providers (GitHub)
- Test social media account linking
- Test email verification flow
- Test password reset flow
- Test two-factor authentication
- Test rate limiting on failed attempts
- Load test with multiple concurrent users

---

## Questions or Issues?

Refer to:
- `COMPLETE_AUTH_SUMMARY.md` - Full architecture overview
- `AUTH_SETUP.md` - OAuth setup instructions
- `GOOGLE_OAUTH_REDIRECT_NOTE.md` - Google OAuth specific issues
- Backend logs (terminal)
- Browser DevTools Console
- Network tab to see API requests

Happy testing! 🚀
