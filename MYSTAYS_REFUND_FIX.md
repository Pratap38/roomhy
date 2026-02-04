# MyStays Refund Workflow Fix

## Changes Made ✅

### 1. Removed Booking ID Display
**File:** `website/mystays.html`
**Change:** Removed the "Booking ID" section from booking cards
- Before: Showed both Property ID and Booking ID in 2-column grid
- After: Shows only Property ID
- Line: 508-511

### 2. Fixed Refund Modal Auto-Population
**File:** `website/mystays.html`
**Changes in `openRefundModal()` function:**

Added auto-population of:
- User name from booking data
- User phone from booking data
- Property location (removed "Booking ID" display)

Added field enrichment:
```javascript
selectedBooking.booking_id = selectedBooking._id || selectedBooking.id || '';
selectedBooking.user_id = selectedBooking.user_id || localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
selectedBooking.payment_id = selectedBooking.payment_id || selectedBooking.paymentId || selectedBooking._id || '';
```

### 3. Enhanced Refund Submission
**File:** `website/mystays.html`
**Changes in `submitRefundRequest()` function:**

**Better field extraction:**
```javascript
const bookingId = selectedBooking._id || selectedBooking.id || '';
const userId = selectedBooking.user_id || localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
const paymentId = selectedBooking.payment_id || selectedBooking.paymentId || selectedBooking._id || '';
```

**Improved field fallbacks:**
- Name: Checks input value first, then booking.name, then booking.user_name
- Phone: Checks input value first, then booking.phone, then booking.user_phone
- Email: From booking.email or booking.user_email

**Added console logging:**
```javascript
console.log('📤 Submitting refund request:', refundPayload);
console.log('   Booking ID:', bookingId);
console.log('   User ID:', userId);
console.log('   Payment ID:', paymentId);
```

### 4. Modal Form Auto-Fill
**File:** `website/mystays.html`
**Changes in `openRefundModal()` function:**

When modal opens:
```javascript
document.getElementById('refundName').value = selectedBooking.name || selectedBooking.user_name || '';
document.getElementById('refundPhone').value = selectedBooking.phone || selectedBooking.user_phone || '';
```

## How It Works Now

### User Flow:
1. **Tenant opens mystays.html** → Sees booking cards with property image
2. **Clicks "Refund" button** → Modal opens with:
   - Property name auto-filled
   - Name field pre-populated with booking data
   - Phone field pre-populated with booking data
3. **Fills in refund details** → System collects:
   - booking_id (from booking._id)
   - user_id (from booking data or localStorage)
   - payment_id (from booking.payment_id or booking._id)
   - user_name (auto-filled from booking)
   - user_phone (auto-filled from booking)
   - request_type (refund or alternative)
4. **Submits refund request** → Backend processes it

### Data Structure Sent to Backend:
```javascript
{
  booking_id: "507f1f77bcf86cd799439011",        // MongoDB _id
  user_id: "roomhyweb000011",                    // From booking or localStorage
  payment_id: "507f1f77bcf86cd799439011",        // From booking
  user_name: "Yasmine Fathima",                  // Auto-filled from booking
  user_phone: "+918866729656",                   // Auto-filled from booking
  user_email: "yasminefathima0401@gmail.com",
  refund_amount: 500,                            // From booking.total_amount
  request_type: "refund",                        // Or "alternative_property"
  refund_method: "upi",                          // UPI or bank
  upi_id: "yasminefathima0401@gmail.com",
  ...
}
```

## Debugging

### Check Console Logs
Open browser DevTools (F12) → Console tab:

```
🎫 Opening refund modal for booking: {...}
   Booking ID: 507f1f77bcf86cd799439011
   User ID: roomhyweb000011
   Payment ID: 507f1f77bcf86cd799439011

📤 Submitting refund request: {...}
   Booking ID: 507f1f77bcf86cd799439011
   User ID: roomhyweb000011
   Payment ID: 507f1f77bcf86cd799439011
```

### If Still Getting 400 Error
Check that ALL these fields are present and not empty:
1. ✅ booking_id - Should be 24-char MongoDB ID
2. ✅ user_id - Should match logged-in user
3. ✅ payment_id - Should be same as booking_id
4. ✅ user_name - Should be pre-filled
5. ✅ user_phone - Should be pre-filled
6. ✅ request_type - Should be "refund" or "alternative_property"

### If Fields Are Missing
Check browser localStorage:
```javascript
// In DevTools console:
localStorage.getItem('userId')
sessionStorage.getItem('userId')
```

Should return a user ID like `roomhyweb000011`

## Testing Checklist ✅

- [ ] **Booking cards display** without "Booking ID" section
- [ ] **Property ID shows** in single box
- [ ] **Click "Refund" button** → Modal opens
- [ ] **Name field auto-filled** with tenant name
- [ ] **Phone field auto-filled** with tenant phone
- [ ] **Select refund method** (UPI or Bank)
- [ ] **Fill in payment details** (UPI ID or Bank info)
- [ ] **Click "Submit Request"** → No 400 error
- [ ] **Success message appears** → "Request Submitted!"
- [ ] **Backend logs show** successful submission

## Browser Console Expected Output

**When page loads:**
```
Loading bookings for user: roomhyweb000011
✅ Found 2 bookings for user roomhyweb000011
```

**When clicking Refund button:**
```
🎫 Opening refund modal for booking: {_id: "507f1f...", property_name: "Inu", ...}
   Booking ID: 507f1f77bcf86cd799439011
   User ID: roomhyweb000011
   Payment ID: 507f1f77bcf86cd799439011
```

**When submitting:**
```
📤 Submitting refund request: {booking_id: "507f...", user_id: "room...", ...}
   Booking ID: 507f1f77bcf86cd799439011
   User ID: roomhyweb000011
   Payment ID: 507f1f77bcf86cd799439011
✅ Refund request submitted successfully: {success: true, ...}
```

## Files Modified

1. ✅ `website/mystays.html`
   - Line 508-511: Removed Booking ID display
   - Line 600-624: Enhanced openRefundModal()
   - Line 668-672: Fixed submitRefundRequest() field extraction
   - Auto-fill form fields when modal opens

## Next Steps

1. **Test in browser** - Open mystays.html and test refund flow
2. **Check console** - Verify all IDs are populated
3. **Submit refund** - Should not get 400 error anymore
4. **Verify in backend** - Check refund request saved in MongoDB

---

**Status:** ✅ Ready for testing
**Backend Required:** Node.js server running on localhost:5001
