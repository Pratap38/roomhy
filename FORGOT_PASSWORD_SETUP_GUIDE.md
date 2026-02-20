# Forgot Password Feature - Setup & Usage Guide

## Overview
The forgot password feature has been successfully implemented for the staff login system (index.html). This allows managers, admins, and superadmins to reset their passwords using an OTP-based flow.

## Implementation Details

### Changes Made

#### 1. Frontend (index.html)
- ✅ Removed "Don't have credentials yet? Request access or sign up" text
- ✅ Added "Forgot Password?" button below login form
- ✅ Added 3-step modal wizard:
  - **Step 1**: Enter email address → Send OTP
  - **Step 2**: Enter 6-digit OTP received in email
  - **Step 3**: Enter new password & confirm password

#### 2. Backend API Endpoints

Added three new endpoints in `/api/auth/forgot-password/`:

##### POST `/api/auth/forgot-password/request-otp`
- **Purpose**: Request OTP for password reset
- **Request Body**:
  ```json
  {
    "email": "manager@example.com"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to your email"
  }
  ```
- **Response (Error)**:
  ```json
  {
    "message": "Email not found in staff management system"
  }
  ```

##### POST `/api/auth/forgot-password/verify-otp`
- **Purpose**: Verify OTP and get reset token
- **Request Body**:
  ```json
  {
    "email": "manager@example.com",
    "otp": "123456"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "token": "jwt_reset_token"
  }
  ```
- **Response (Error)**:
  ```json
  {
    "message": "Invalid OTP. Please try again."
  }
  ```

##### POST `/api/auth/forgot-password/reset-password`
- **Purpose**: Reset password after OTP verification
- **Request Body**:
  ```json
  {
    "email": "manager@example.com",
    "token": "jwt_reset_token",
    "newPassword": "securePassword123"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "message": "Password reset successful. You can now login with your new password.",
    "redirect": "/index.html"
  }
  ```

### Feature Flow

1. **User clicks "Forgot Password?"** button on index.html login page
2. **User enters email** → Email is validated
3. **System checks** if email exists in staff database (managers, admins, superadmin)
4. **If email found**: OTP is sent to the email (valid for 10 minutes)
5. **User enters OTP** from email
6. **If OTP valid**: User can proceed to set new password
7. **User enters new password** and confirms it
8. **Password is updated** in database
9. **User is redirected** to login page (index.html)
10. **User logs in** with updated credentials and accesses dashboard

## How to Use

### For Users (Staff/Managers)

1. Go to the login page: `http://localhost:5000/index.html`
2. Click **"Forgot Password?"** button
3. Enter your email address and click **"Send OTP"**
4. Check your email for the OTP code (6 digits)
5. Enter the OTP and click **"Verify OTP"**
6. Enter your new password (minimum 6 characters)
7. Confirm the new password
8. Click **"Reset Password"**
9. You'll see a success message
10. Login with your new password

### Gmail SMTP Configuration (Required)

To enable email sending, configure your Gmail account:

1. **Enable 2-Factor Authentication**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character app password

3. **Update .env file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

4. **Restart the server**:
   ```bash
   npm run start
   ```

## Technical Specifications

### OTP Details
- **Length**: 6 digits
- **Validity**: 10 minutes
- **Storage**: In-memory Map (consider using Redis for production)
- **Format**: Numeric only

### Reset Token Details
- **Type**: JWT
- **Validity**: 15 minutes
- **Claims**: 
  - `email`: User's email
  - `type`: "forgot-password"
  - `exp`: Expiry timestamp

### Password Requirements
- **Minimum Length**: 6 characters
- **Validation**: Basic length check (consider adding complexity requirements in production)

### User Types Supported
The forgot password feature works for:
- ✅ Superadmin (email format)
- ✅ Area Managers (MGR prefix)
- ✅ Managers/Admins
- ✅ Employees

### Security Features Implemented
1. ✅ OTP expiry (10 minutes)
2. ✅ Reset token expiry (15 minutes)
3. ✅ Email verification
4. ✅ Password strength validation (minimum 6 characters)
5. ✅ Confirmation email sent after password reset
6. ✅ Rate limiting recommended (not implemented yet)

## Files Modified/Created

### Frontend
- `index.html` - Added forgot password modal and JavaScript functions

### Backend
- `roomhy-backend/routes/authRoutes.js` - Added three new routes
- `roomhy-backend/controllers/authController.js` - Added three new controller functions:
  - `forgotPasswordRequestOTP()`
  - `forgotPasswordVerifyOTP()`
  - `forgotPasswordReset()`

## Testing the Feature

### Manual Testing Steps

1. **Test 1: Valid Email**
   - Click "Forgot Password?"
   - Enter valid manager email
   - Verify OTP is sent to email
   - Enter correct OTP
   - Set new password
   - Verify login works with new password

2. **Test 2: Invalid Email**
   - Click "Forgot Password?"
   - Enter non-existent email
   - Should see "Email not found" error

3. **Test 3: Wrong OTP**
   - Request OTP
   - Enter incorrect OTP
   - Should see "Invalid OTP" error

4. **Test 4: Expired OTP**
   - Request OTP
   - Wait 10+ minutes
   - Enter OTP
   - Should see "OTP has expired" error

5. **Test 5: Password Mismatch**
   - Verify OTP successfully
   - Enter mismatched passwords
   - Should see "Passwords do not match" error

## Future Enhancements

1. **Rate Limiting**: Implement rate limiting to prevent OTP spam (e.g., max 3 attempts per email per hour)
2. **Resend OTP**: Add "Resend OTP" button with cooldown
3. **Password Complexity**: Add stronger password requirements (uppercase, lowercase, numbers, special chars)
4. **Redis Storage**: Move OTP storage to Redis for distributed systems
5. **SMS OTP**: Add SMS as alternative to email OTP
6. **Two-Factor Authentication**: Implement 2FA for additional security
7. **Login Attempt Tracking**: Track failed login attempts and temporary account lockdown
8. **Password History**: Prevent reusing old passwords

## Troubleshooting

### OTP Not Received
1. Check .env file SMTP configuration
2. Verify "Less secure apps" is enabled (if not using app password)
3. Check spam/junk folder in email
4. Verify email address is correct
5. Check server logs for email sending errors

### Password Reset Fails
1. Verify OTP was verified successfully
2. Check if reset token has expired (15 minute limit)
3. Ensure password meets minimum length (6 characters)
4. Check database connection

### Server Errors
1. Restart server: `npm run start`
2. Check MongoDB connection
3. Verify JWT_SECRET is set in .env
4. Check console logs for detailed errors

## Production Considerations

1. **OTP Storage**: Move from in-memory Map to Redis or database
2. **Rate Limiting**: Implement to prevent brute force attacks
3. **HTTPS**: Ensure site uses HTTPS in production
4. **Email Templates**: Use professional HTML templates
5. **Monitoring**: Add logging and monitoring for password reset attempts
6. **Audit Trail**: Log password reset events for security audit
7. **Session Management**: Ensure old sessions are invalidated after password change
8. **CORS**: Verify CORS is properly configured for APIs

## Support

For issues or questions regarding the forgot password feature:
1. Check this guide first
2. Review console logs for errors
3. Verify all .env configurations
4. Check MongoDB connection and collections
5. Test API endpoints using Postman or similar tools
