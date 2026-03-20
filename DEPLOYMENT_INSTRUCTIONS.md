# Deployment Instructions - Email-First Chat ID Resolution Fix

## What was fixed
The chat messaging system now uses email-based user ID generation as the PRIMARY resolution method (instead of falling back to database IDs). This ensures both owner and website user use the same normalized ID format (`roomhyweb` + 6-digit hash) when routing messages.

## Files Changed
- `react-app/src/pages/propertyowner/ownerchat.jsx` - Email-first ID resolution for owners sending messages
- `react-app/src/pages/website/websitechat.jsx` - Email-first ID resolution for website users joining chat rooms

## Deployment Steps (Run on VPS as root)

```bash
# 1. SSH into VPS
ssh root@187.77.185.198

# 2. Navigate to app directory
cd /var/www/roomhy

# 3. Pull latest code
git pull origin main

# 4. Verify the changes (optional)
git log -1 --oneline

# 5. Rebuild frontend (if needed)
cd react-app
npm install  # Only if dependencies changed
npm run build

# 6. Return to root
cd ..

# 7. Restart PM2 to reload backend
pm2 restart roomhy-backend

# 8. Check if restart was successful
pm2 logs roomhy-backend --lines 20

# Expected success indicators in logs:
# ✓ Backend running on http://localhost:5001
# ✓ User joined: [name] (property_owner/website_user) - Room: [roomhyweb######]
# ✓ Message saved: [sender] -> [roomhyweb######]   (NOT MongoDB ID)
```

## What to verify after deployment

### In PM2 logs:
1. **Website user joining**: Look for `✓ User joined: mariyam Fathima (website_user) - Room: roomhyweb188990`
2. **Owner sending message**: Look for `✓ Message saved: ROOMHY0523 -> roomhyweb188990` (NOT `69bc39a84f3e73d19bba8a24`)
3. **Console debug logs**: 
   - `🐛 Resolved from email:` (in owner chat)
   - `🐛 Website user joining room:` (in website chat)

### In browser console (F12):
When sending/receiving messages, you should see:
- `🐛 SendMessage Debug: { email, resolvedUserId, ownerLoginId }`
- `🐛 Website user joining room: { email, resolvedLoginId }`

## If messages still don't flow:

1. **Check the email field exists**: 
   - In PM2 logs, verify booking has `"email": "yasmii0429@gmail.com"`
   
2. **Verify hash consistency**:
   - Both components use identical hash function: `hash = (hash * 31 + char) % 1000000`
   - Email `yasmii0429@gmail.com` should ALWAYS generate `roomhyweb188990`

3. **Check socket.io broadcasts**:
   - Verify `io.to(roomhyweb188990)` receives messages
   - Check backend socket aliases are working

4. **Restart Socket.io connections**:
   - Refresh browser for website user to re-join room
   - Owner can reconnect chat

## Rollback (if needed)
```bash
git revert HEAD
pm2 restart roomhy-backend
```

## Questions to ask if still failing:
- Is the booking API returning the `email` field?
- Are there any Socket.io connection errors in PM2 logs?
- Is CORS properly configured for all domains?
