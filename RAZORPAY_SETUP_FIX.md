# Razorpay 401 Unauthorized - Complete Fix Guide

## Problem
You're seeing **401 Unauthorized** errors when trying to use Razorpay checkout:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
api.razorpay.com/v2/standard_checkout/preferences...
api.razorpay.com/v1/standard_checkout/preferences...
```

## Root Cause
The Razorpay key is not properly configured in your backend `.env` file. The system is currently using a **placeholder/test key** (`rzp_test_default`) that Razorpay rejects with 401 errors.

## Solution - Step by Step

### Step 1: Get Your Razorpay Keys
1. Go to https://dashboard.razorpay.com
2. Log in to your Razorpay account
3. Navigate to **Settings → API Keys**
4. You'll see two keys:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (keep this private!)

### Step 2: Update Your .env File
Create or update the file: `roomhy-backend/.env`

Add these lines:
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_key_secret_here
```

**Replace the values with your actual keys from Step 1.**

### Step 3: Restart Your Backend Server
```powershell
# Stop the current server
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Navigate to backend folder
cd roomhy-backend

# Start fresh
npm start
```

### Step 4: Clear Browser Cache
1. Open DevTools (F12)
2. Go to **Application → Local Storage**
3. Clear all entries
4. Go to **Application → Session Storage**
5. Clear all entries
6. Hard refresh the page (Ctrl+Shift+R)

### Step 5: Test the Payment Flow
1. Navigate to the booking form
2. Open Browser Console (F12)
3. You should see: `✅ Razorpay key loaded successfully`
4. Try the payment button
5. Razorpay checkout should open without 401 errors

---

## Debugging Tips

### Check Backend Configuration
```powershell
# In your terminal, run:
echo $env:RAZORPAY_KEY_ID
```

Should output your actual key, not `rzp_test_default`.

### Monitor Logs
When you start the server, look for:
```
✅ Razorpay key loaded successfully
🔑 Using key: rzp_test_...
```

### If Still Getting 401 Errors
1. **Invalid Key Format**: Razorpay keys always start with `rzp_test_` or `rzp_live_`
2. **Key Copied Incorrectly**: Make sure there are no extra spaces or characters
3. **Razorpay Account Issue**: 
   - Verify your Razorpay account is active
   - Check if keys are enabled in dashboard
   - Try regenerating the keys

### Check Razorpay Dashboard
- Visit https://dashboard.razorpay.com/app/keys
- Verify your Key ID is visible and enabled
- If disabled, click to enable it

---

## For Production (Live Keys)

When you're ready for production:

1. Get your **Live Keys** from Razorpay dashboard (different from test keys)
2. Update `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_live_secret_here
   ```
3. Restart the server
4. Test thoroughly with test transactions first

---

## Console Output Reference

### ✅ Success (Key Loaded)
```
🔄 Fetching Razorpay key from: https://roomhy-backend-wqwo.onrender.com/api/booking/config/razorpay-key
✅ Razorpay key loaded successfully
🔑 Using key: rzp_test_...
✅ Razorpay checkout opened
```

### ❌ Error (Missing/Invalid Key)
```
⚠️ Razorpay key is not configured properly in the backend (.env file)
⚠️ RAZORPAY_KEY_ID environment variable needs to be set to a valid Test/Live key
```

### ❌ Error (401 from Razorpay)
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
❌ CONFIGURATION ERROR: Razorpay key is not properly configured
```

---

## Environment Variables Summary

Your `.env` file should contain:
```env
# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_here

# Razorpay - REQUIRED for payments
RAZORPAY_KEY_ID=rzp_test_your_actual_key_here
RAZORPAY_KEY_SECRET=your_actual_secret_here

# Optional
IMPORT_SECRET=your_secret
```

---

## Quick Checklist
- [ ] You have a Razorpay account (create at https://razorpay.com)
- [ ] You've copied your Key ID from the dashboard
- [ ] You've updated `roomhy-backend/.env` with the key
- [ ] Backend server has been restarted
- [ ] Browser cache has been cleared
- [ ] Console shows "✅ Razorpay key loaded successfully"
- [ ] Payment button opens Razorpay checkout

---

## Still Having Issues?

### Contact Razorpay Support
- Email: support@razorpay.com
- Dashboard: https://dashboard.razorpay.com/support

### Common Questions
**Q: Where do I find my keys?**
A: https://dashboard.razorpay.com/app/keys

**Q: What's the difference between Test and Live keys?**
A: Test keys are for development/testing. Live keys process real payments.

**Q: Can I use the same key on multiple servers?**
A: Yes, but for security, rotate keys periodically on Razorpay dashboard.

**Q: How do I know if my key is valid?**
A: Try making a test payment. If you get 401, the key is invalid or misconfigured.
