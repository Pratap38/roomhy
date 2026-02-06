# Accepted Bookings Flow: Database Integration

## Overview
When a property owner accepts a booking request in `booking_request.html`, the acceptance is stored in the database and immediately made available in `websitechat.html` for the tenant to see.

---

## Complete Flow

### 1️⃣ **Owner Accepts Booking in booking_request.html**

**Location:** `propertyowner/booking_request.html` - `acceptRequest()` function

**What Happens:**
1. Owner clicks "Accept" button on a booking request
2. Confirmation dialog appears
3. If confirmed, the acceptance process begins:

```javascript
async function acceptRequest(requestId, requestName, requestEmail) {
    // Update status to 'accepted'
    request.status = 'accepted';
    request.responseDate = new Date().toISOString();
    
    // Save to localStorage immediately
    localStorage.setItem('roomhy_booking_requests', JSON.stringify(allBookingsReq));
    
    // IMPORTANT: Save to database with complete data
    await fetch(`${API_URL}/api/booking/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            bookingId: requestId,
            status: 'accepted',  // ← Key field
            responseDate: request.responseDate,
            acceptedAt: new Date().toISOString(),
            name: requestName,
            email: requestEmail,
            user_id: request.user_id,
            property_id: request.property_id,
            property_name: request.property_name
        })
    });
    
    // Create chat room for communication
    await createChatRoom(requestId, requestName, requestEmail, request);
    
    // Re-fetch to confirm
    await loadBookingRequests();
}
```

**Database Update:**
- Endpoint: `PUT /api/booking/update`
- Status field: `status: 'accepted'`
- Additional fields: `acceptedAt`, `responseDate`
- Also includes: `user_id`, `property_id`, `property_name`, `name`, `email`

---

### 2️⃣ **Booking Stored in Database**

**Database Collection:** `bookings` or `booking_requests`

**Fields Updated:**
```javascript
{
    _id: "booking_123",
    user_id: "tenant_user_id",
    owner_id: "owner_user_id",
    property_id: "property_123",
    property_name: "2BHK Apartment",
    name: "Tenant Name",
    email: "tenant@example.com",
    status: "accepted",        // ← PRIMARY FIELD
    responseDate: "2026-02-06T10:30:00Z",
    acceptedAt: "2026-02-06T10:30:00Z",
    rent: 15000,
    location: "Delhi",
    created_at: "2026-02-06T09:00:00Z"
}
```

**Key Fields for Filtering:**
- `status: 'accepted'` - Indicates owner has accepted
- `acceptedAt` - Timestamp of acceptance
- `user_id` - Tenant's user ID
- `owner_id` - Owner's ID

---

### 3️⃣ **Tenant Views Accepted Booking in websitechat.html**

**Location:** `website/websitechat.html` - `loadChats()` function

**What Happens:**
1. Page loads and calls `loadChats()`
2. Fetches all bookings from database for the logged-in user
3. Filters to show ONLY 'accepted' status bookings
4. Displays them in the chat list

```javascript
async function loadChats() {
    // Fetch all bookings for user
    const response = await fetch(`${API_URL}/api/booking/requests?user_id=${userId}`);
    const allBookings = response.data || [];
    
    // FILTER: Only show accepted bookings
    const acceptedBookings = allBookings.filter(b => {
        const status = (b.status || '').toLowerCase();
        return ['accepted', 'accepted_by_owner'].includes(status);
    });
    
    console.log(`Total: ${allBookings.length}, Accepted: ${acceptedBookings.length}`);
    
    // Process and render accepted chats
    acceptedBookings.forEach(booking => {
        // Create chat entry with owner info
        const chat = {
            owner_name: booking.owner_name,
            property_name: booking.property_name,
            status: 'accepted',
            bookingId: booking._id
        };
        
        // Render in UI
        renderChatItem(chat);
    });
}
```

**Chat List Display:**
```
┌─ Accepted Chats ──────┐
│                       │
│ 👤 Owner Name        │
│   2BHK Apartment      │
│   ✅ Accepted        │
│                       │
│ 👥 Another Owner     │
│   Studio Room         │
│   ✅ Accepted        │
│                       │
└───────────────────────┘
```

---

## Status Fields Used

### In Database
| Status Value | Meaning | Shown in Chat? |
|---|---|---|
| `'accepted'` | Owner accepted | ✅ YES |
| `'accepted_by_owner'` | Owner explicitly accepted | ✅ YES |
| `'confirmed'` | Booking confirmed | ✅ YES |
| `'pending'` | Awaiting owner response | ❌ NO |
| `'rejected'` | Owner rejected | ❌ NO |

### Filter Logic (websitechat.html)
```javascript
const isAccepted = ['accepted', 'accepted_by_owner', 'owner_accepted'].includes(status.toLowerCase());
const isConfirmed = ['confirmed', 'confirm'].includes(status.toLowerCase());
const showInChat = isAccepted || isConfirmed;
```

---

## Error Handling

### If Database Save Fails in booking_request.html:
1. localStorage is updated (offline fallback)
2. Tries primary endpoint `/api/booking/update`
3. If fails, tries alternative `/api/bookings/{id}` endpoint
4. Chat room is created regardless
5. User gets success message

### If Fetch Fails in websitechat.html:
1. Falls back to localStorage chatRooms
2. Falls back to backend chat API
3. Combines all available sources

---

## Real-Time Updates

### Auto-Refresh Mechanism:
```javascript
// After owner accepts, websitechat automatically loads new chats
setInterval(() => {
    loadChats(); // Refresh every time page is active
}, 5000); // Every 5 seconds

// Also listen to storage changes from other tabs
window.addEventListener('storage', loadChats);
```

### Tenant's Experience:
1. Tenant is on `websitechat.html`
2. Owner accepts request in `booking_request.html`
3. Database updates with `status: 'accepted'`
4. Tenant's page refreshes
5. Chat appears in accepted chats list
6. Tenant can immediately click to chat with owner

---

## Data Flow Diagram

```
OWNER ACCEPTS IN booking_request.html
                    ↓
    1. Update status → 'accepted'
    2. Save to localStorage
    3. Send to Database (PUT /api/booking/update)
                    ↓
            DATABASE STORES
            {status: 'accepted'}
                    ↓
    TENANT'S websitechat.html
    1. Fetch /api/booking/requests
    2. Filter by status='accepted'
    3. Display in chat list
                    ↓
        ✅ TENANT SEES ACCEPTED BOOKING
        Can click to chat with owner
```

---

## Testing

### Step 1: Owner Accepts
1. Go to `propertyowner/booking_request.html`
2. Find a booking with status 'pending'
3. Click "Accept" button
4. Check browser console for: `✅ Database update successful`

### Step 2: Verify Database
```javascript
// Check what was saved
console.log('Saved booking:', allBookingsReq[reqIdx]);
```

### Step 3: Tenant Sees It
1. Open `website/websitechat.html` in new tab
2. Should see the accepted booking in chat list
3. Status should show "✅ Accepted"

### Step 4: Verify Filter
```javascript
// In websitechat.html loadChats()
console.log('All bookings:', allBookings.length);
console.log('Accepted:', acceptedBookings.length);
```

---

## Files Modified

### 1. `propertyowner/booking_request.html`
- Enhanced `acceptRequest()` function
- Better database integration
- Sends complete booking data to DB
- Fallback endpoints for reliability

### 2. `website/websitechat.html`
- Improved `loadChats()` function
- Better filtering of accepted bookings
- Shows only status='accepted' chats
- Multiple data source fallbacks
- Better debugging logs

---

## Success Indicators

✅ When working correctly:
- Console shows: `✅ Database update successful`
- Chat appears in websitechat.html immediately
- Status badge shows "✅ Accepted"
- Tenant can click to open chat

❌ If not working:
- Check database has `status: 'accepted'` field
- Verify API endpoints exist
- Check user_id matches between requests
- Look for CORS errors in console

---

## API Endpoints Required

1. **Accept Booking (Owner Side)**
   - `PUT /api/booking/update` - Update booking status
   - Alternative: `PATCH /api/bookings/{id}` - Fallback

2. **Fetch Bookings (Tenant Side)**
   - `GET /api/booking/requests?user_id={id}` - Get all bookings
   - Alternative: `GET /api/bookings?tenant_id={id}`

3. **Optional: Chat Rooms**
   - `GET /api/chat/rooms?user_email={email}` - Get existing chats
   - `POST /api/chat/rooms` - Create new chat room

---

## Sequence Timeline

```
T0: Owner navigates to booking_request.html
T1: Owner clicks Accept button
T2: Status updated in localStorage
T3: Database receives PUT /api/booking/update
T4: Status saved as 'accepted' in DB
T5: Chat room created
T6: Tenant's websitechat refreshes
T7: loadChats() fetches bookings from DB
T8: Filter finds status='accepted'
T9: Chat displayed in tenant's list
T10: Tenant sees "✅ Accepted" badge
T11: Tenant can click to open chat
```

**Total Time:** ~2-5 seconds from acceptance to visibility

---

## Summary

The complete flow ensures:
1. ✅ Acceptance is **stored permanently** in database
2. ✅ Tenant **immediately sees** accepted bookings
3. ✅ Both users can **start chatting** about the property
4. ✅ **Fallback mechanisms** ensure reliability
5. ✅ **Real-time updates** as status changes
