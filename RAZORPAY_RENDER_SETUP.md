# Razorpay Setup for Render Deployment

## Problem
Your local `.env` has the correct Razorpay keys, but **Render doesn't have them**. The deployed backend at `https://roomhy-backend-wqwo.onrender.com` is returning `rzp_test_default` and failing to create orders.

**Error:** `"key_id" or "oauthToken" is mandatory"`
**Cause:** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are not set in Render environment

## Solution: Set Environment Variables on Render

### Step 1: Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Log in to your account
3. Find your backend service: **roomhy-backend** or similar name

### Step 2: Access Environment Variables
1. Click on your backend service
2. Go to **Settings** tab
3. Scroll to **Environment** section
4. Click **Edit Environment Variables** or **Add Environment Variable**

### Step 3: Add Razorpay Keys
Add these two variables:

**Variable 1:**
- Name: `RAZORPAY_KEY_ID`
- Value: `rzp_test_S98wbc6TJMLA4F`

**Variable 2:**
- Name: `RAZORPAY_KEY_SECRET`
- Value: `1NasXSwzhWeiZ7fqUKDuHBnE`

### Step 4: Deploy Changes
1. After adding variables, Render will automatically trigger a redeploy
2. Wait for deployment to complete (you'll see status change to "Live")
3. Check logs to verify keys are loaded

### Step 5: Test
1. Clear browser cache: **Ctrl+Shift+R**
2. Open booking form again
3. Try to create a payment order
4. Should now succeed ✅

---

## Verification Steps

### Check Render Logs
1. In Render dashboard, go to your backend service
2. Click **Logs** tab
3. You should see:
```
✅ Razorpay key configured: rzp_test_S98wbc6...
```

### If Still Failing
1. Check "Render Environment Variables Actually Set"
   - Go to Settings → Environment
   - Verify both variables are listed
   
2. Check "Service Was Redeployed"
   - Look at Logs tab
   - Should show a new deployment after you added variables
   
3. Trigger Manual Redeploy
   - Go to **Settings** → **Manual Deploy** → Click **Deploy Latest Commit**

---

## All Environment Variables for Render

Your Render service should have these variables:

```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb+srv://roomhydb:roomhydbkota41@cluster0.cj1yqn9.mongodb.net/?appName=Cluster0
JWT_SECRET=roomhy_secret_key_123

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=roomhy01@gmail.com
SMTP_PASS=azvv lpew xliq bxil
FROM_EMAIL=roomhy01@gmail.com

CLOUDINARY_CLOUD_NAME=dpwgvcibj
CLOUDINARY_API_KEY=797434474725911
CLOUDINARY_API_SECRET=T2F9BtUmk_ZpHxZLZD3OTAVNTb4
CLOUDINARY_UPLOAD_PRESET=roomhy_locations

RAZORPAY_KEY_ID=rzp_test_S98wbc6TJMLA4F
RAZORPAY_KEY_SECRET=1NasXSwzhWeiZ7fqUKDuHBnE
```

---

## Important Notes

### 🔒 Security Best Practices
- ✅ Your test keys are safe to share (they only work in test mode)
- ❌ Never commit `.env` to Git
- ❌ Never share `.env` in Slack/Teams
- ✅ Use Render's secure environment variable storage
- ✅ When moving to production, replace with LIVE keys only in Render, not in Git

### 📝 For Local Testing
- Local backend continues using local `.env`
- Deployed backend uses Render environment variables
- No git commits needed

### 🔄 For Production
- Change `RAZORPAY_KEY_ID` to your **LIVE key** (starts with `rzp_live_`)
- Change `RAZORPAY_KEY_SECRET` to your **LIVE secret**
- Keep `NODE_ENV=development` or change to `production` if needed
- Restart Render service after changes

---

## Testing Checklist

After setting environment variables on Render:

- [ ] Render shows both RAZORPAY variables in Settings → Environment
- [ ] Service was redeployed (check Logs for new deployment)
- [ ] Browser console shows: `✅ Razorpay key loaded successfully`
- [ ] Browser console shows: `🔄 Creating Razorpay order on backend...`
- [ ] Browser console shows: `✅ Razorpay order created: order_XXXXX`
- [ ] Razorpay checkout opens without 401 errors
- [ ] Payment can be completed

---

## Troubleshooting

### Issue: "Razorpay key is not configured properly"
**Solution:** Environment variables not set on Render
- Go to Render Settings → Environment
- Verify both RAZORPAY variables are there
- Trigger manual redeploy

### Issue: "key_id or oauthToken is mandatory"
**Solution:** Same as above - variables not in Render environment

### Issue: Changes not taking effect
**Solution:** Service needs to redeploy
- Go to Settings → Manual Deploy
- Click "Deploy Latest Commit"
- Wait for deployment to complete

### Issue: Still getting 500 errors
**Solution:** Check Render logs
- Click Logs tab
- Look for "RAZORPAY CONFIGURATION ERROR"
- Verify variable names are EXACT: `RAZORPAY_KEY_ID` (not `RAZORPAY_KEYID`)

---

## Quick Reference

| Step | What | Where |
|------|------|-------|
| 1 | Go to dashboard | https://dashboard.render.com |
| 2 | Select service | Click your backend service |
| 3 | Edit variables | Settings → Environment |
| 4 | Add KEY_ID | `RAZORPAY_KEY_ID=rzp_test_S98wbc6TJMLA4F` |
| 5 | Add SECRET | `RAZORPAY_KEY_SECRET=1NasXSwzhWeiZ7fqUKDuHBnE` |
| 6 | Deploy | Wait for auto-redeploy or click "Deploy Latest Commit" |
| 7 | Test | Open booking form and try payment |

---

## Local vs Deployed

**Local Testing (http://localhost:5001)**
- Uses `.env` in `roomhy-backend/` folder
- Your keys are already there ✅
- Test on http://localhost:3000/booking-form.html

**Deployed (https://roomhy-backend-wqwo.onrender.com)**
- Uses Render Environment Variables
- Keys need to be set in Render dashboard
- Test on live website with booking form

---

**Status:** Backend code updated with better error handling
**Next:** Set environment variables on Render (steps above)
**Then:** Test payment flow ✅
