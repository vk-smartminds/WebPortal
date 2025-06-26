# JWT Authentication Implementation

This document explains the JWT (JSON Web Token) authentication system implemented for persistent login sessions.

## Backend Changes

### 1. New Dependencies
- Added `jsonwebtoken` package for JWT handling

### 2. New Files Created
- `backend/middleware/auth.js` - JWT authentication middleware
- `frontend/utils/auth.js` - Frontend token management utilities
- `frontend/components/ProtectedRoute.js` - Protected route component

### 3. Updated Files
- `backend/controller/userController.js` - Added JWT token generation
- `backend/routes/routes.js` - Added protected routes with authentication
- `frontend/service/api.js` - Added automatic token handling
- `frontend/pages/Login.js` - Updated to store JWT tokens
- `frontend/pages/MainHome.js` - Wrapped with ProtectedRoute
- `frontend/pages/ProfileMenu.js` - Updated to use JWT authentication

## Environment Variables

Add the following to your `backend/.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## How It Works

### 1. Login Process
1. User submits login credentials (email/password or OTP)
2. Backend validates credentials
3. If valid, backend generates a JWT token with user ID
4. Frontend stores the token in localStorage
5. User is redirected to protected pages

### 2. Token Verification
1. Frontend automatically includes JWT token in API requests
2. Backend middleware verifies token on protected routes
3. If token is valid, request proceeds; if not, returns 401
4. Frontend automatically redirects to login on 401 responses

### 3. Persistent Sessions
- JWT tokens expire after 7 days
- Users stay logged in across browser sessions
- Automatic logout when token expires

## Protected Routes

The following routes now require JWT authentication:
- `GET /api/verify-token` - Verify token and get user profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

## Frontend Features

### 1. Automatic Token Management
- Tokens are automatically included in API requests
- Expired tokens are automatically removed
- Users are redirected to login when tokens expire

### 2. Protected Routes
- MainHome page is now protected
- Users must be authenticated to access protected content

### 3. Logout Functionality
- Proper logout clears all tokens and user data
- Redirects to login page

## Security Features

1. **Token Expiration**: Tokens expire after 7 days
2. **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
3. **Automatic Cleanup**: Expired tokens are automatically removed
4. **Route Protection**: Protected routes verify tokens on every request

## Usage

### For Users
1. Login normally with email/password or OTP
2. Stay logged in across browser sessions
3. Automatically logged out after 7 days or when token expires

### For Developers
1. Add `JWT_SECRET` to backend environment variables
2. Use `ProtectedRoute` component to protect pages
3. Use `getToken()` and `setToken()` utilities for manual token management
4. API calls automatically include authentication headers

## Production Considerations

1. **Change JWT Secret**: Use a strong, unique secret in production
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Consider using httpOnly cookies instead of localStorage for better security
4. **Token Refresh**: Implement token refresh mechanism for better UX
5. **Rate Limiting**: Add rate limiting to authentication endpoints 