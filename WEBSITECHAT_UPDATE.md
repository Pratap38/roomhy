# WebsiteChat.html - User Session & Owner Info Update

## Summary of Changes

Updated `websitechat.html` to properly use the userid from the website session (created during signup) and ensure owner information is clearly displayed.

## Key Updates

### 1. **Proper User Session Loading** (loadUser() function)
- **Before**: Only checked generic `user` key
- **After**: 
  - Uses AuthUtils.getCurrentUser() first (checks `website_user`, `staff_user`, `owner_user` in priority order)
  - Falls back to manual `website_user` key check
  - Falls back to legacy `user` key
  - Falls back to KYC API fetch
  - Added comprehensive logging with `[WebsiteChat]` prefix

**Code Pattern**:
```javascript
// Priority order for user session:
1. AuthUtils.getCurrentUser() - proper session isolation
2. sessionStorage('website_user') - direct website session
3. localStorage('website_user') - persistent website session
4. sessionStorage('user') - legacy key
5. localStorage('user') - legacy persistent
6. KYC API - backend fallback
```

### 2. **Enhanced Chat Header Display** (openChat() function)
- **Before**: Showed "Login ID: ownerId" in subheader only
- **After**:
  - Owner name displayed prominently as main heading
  - Owner ID shown in monospace font in subheader
  - Property name displayed next to owner ID
  - Avatar with color-coded initial

**Chat Header Display**:
```
[Owner Avatar O] Owner Name
                 ID: OWNERID001 • Property Name
```

### 3. **Chat List Rendering** (loadChats() function)
- **Before**: Showed "✅ Accepted | ID: propertyId"
- **After**: Shows "✅ Accepted | Owner ID: [monospace owner_id]"
- Added better logging for debugging bookings and owner info extraction

**Chat List Item Display**:
```
[Avatar] Owner Name
         PROPERTY NAME (uppercase)
         ✅ Accepted | Owner ID: OWNERID
```

### 4. **User ID Integration**
- Reads userid from currentUser using proper priority:
  - `currentUser.id` (created by signup.html as `roomhyweb000001`)
  - `currentUser.loginId` (usually email)
  - Falls back to `localStorage('user_id')`

- Used in:
  - Welcome message: "Hi, [userName]"
  - Chat identification: userId and userEmail for booking queries
  - Message sender ID: `senderId: currentUser.id || currentUser.loginId`

### 5. **Enhanced Logging**
- All console logs prefixed with `[WebsiteChat]` for easier debugging
- Tracks user session loading flow
- Logs owner extraction from multiple field sources
- Logs API endpoint calls and responses
- Tracks chat header updates with owner info

## User Flow

1. **User Signs Up** (signup.html)
   - Stores user to `website_user` key
   - Creates user with structure: `{ id: 'roomhyweb000001', email, firstName, ...}`

2. **User Opens Chat** (websitechat.html)
   - `loadUser()` retrieves user from `website_user` key via AuthUtils
   - Displays welcome message with user name and ID
   - `loadChats()` fetches accepted bookings for this user

3. **User Selects Owner Chat** (websitechat.html)
   - Chat header shows: **Owner Name** (heading) and **ID: ownerID** (subheading)
   - Chat list shows: Owner Name and Owner ID
   - Messages loaded from Firebase using bookingId

## Owner Information Display

The owner information is now displayed in three places:

### 1. **Chat Header** (when chat is open)
- Owner Name: Large, bold heading
- Owner ID: Monospace font, prefixed with "ID:"
- Property: Displayed next to owner ID

### 2. **Chat List Item** (in sidebar)
- Owner Name: Bold heading
- Owner ID: Displayed as "Owner ID: [id]"
- Property Name: Secondary heading (uppercase)

### 3. **Mobile Menu** (top navigation)
- User welcome message: "Hi, [userName]"
- User ID: "ID: [userId]"

## Session Isolation Architecture

```
Sign Up/Login Flow:
  ├─ Website (signup.html)
  │  └─ Stores to: website_user
  │
  ├─ Staff (index.html)
  │  └─ Stores to: staff_user
  │
  └─ Owner (propertyowner/index.html)
     └─ Stores to: owner_user

getCurrentUser() Priority:
  1. website_user (website/chat)
  2. staff_user (internal team)
  3. owner_user (property managers)
  4. user (legacy - backward compat)
```

## Debugging with Console Logs

Filter console for `[WebsiteChat]` to see all websitechat.html operations:

```javascript
// Example logs:
[WebsiteChat] ✅ Loaded user from AuthUtils: roomhyweb000001
[WebsiteChat] 📞 Opening chat with owner: { name: 'John Doe', id: 'OWNER123' }
[WebsiteChat] 📊 Total bookings from DB: 5, Accepted: 3
[WebsiteChat] ✅ Chat header updated - Owner: John Doe, ID: OWNER123
```

## Benefits

✅ **Proper Session Isolation**: Uses `website_user` key to prevent cross-contamination with other login sections
✅ **Same UserID**: Uses uid from signup signup.html structure
✅ **Clear Owner Info**: Owner ID and name prominently displayed in multiple places
✅ **Better Debugging**: Comprehensive console logging with prefixes
✅ **Backward Compatible**: Falls back to legacy `user` key if needed
✅ **API Integration Ready**: Supports both backend API and localStorage fallback

## Testing

Test the following scenarios:
1. Sign up as new user → Verify `website_user` created with proper `id` field
2. Open websitechat.html → Verify user loads from `website_user` key
3. Select a chat with owner → Verify owner name and ID displayed correctly
4. Check console logs → Verify `[WebsiteChat]` prefix on all logs
5. Check localStorage → Verify `website_user` key contains user with `id` field
6. Test on mobile → Verify owner info visible in chat header
