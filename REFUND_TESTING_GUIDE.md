# Refund Workflow - Quick Testing Guide

## Complete Workflow Summary

### What Was Updated
✅ **mystays.html** - Enhanced `submitRefundRequest()` function with:
- Better form validation for all required fields
- Proper data formatting for API submission
- Error handling and user feedback
- Local storage backup if API unavailable
- Loading state during submission
- Auto-refresh bookings after successful submission

✅ **superadmin/refund.html** - Already fully implemented:
- `loadRefundRequests()` - Fetches from GET /api/booking/refund-requests
- `displayRefundRequests()` - Renders table with all refund data
- `updateRefundStats()` - Updates statistics cards
- Admin actions: Approve, Reject, View Details
- Real-time status updates

✅ **Backend** - All endpoints ready:
- `POST /api/booking/refund-request` - Save refund request
- `GET /api/booking/refund-requests` - Fetch all refund requests
- `POST /api/booking/refund-request/{id}/process` - Process refund
- `PUT /api/booking/refund-request/{id}/status` - Update status

## Step-by-Step Testing Workflow

### Step 1: Create a Booking
1. Open `booking-form.html`
2. Fill booking details:
   - Select a property
   - Enter tenant details
   - Enter rent amount (e.g., ₹15,000)
3. Click "Make Payment"
4. Complete Razorpay payment (use test card: 4111111111111111)
5. ✓ Booking confirmation should appear
6. ✓ Data saved to sessionStorage/localStorage

### Step 2: View Booking on MyStays
1. Open `website/mystays.html`
2. You should see your booking card displayed with:
   - Property name and image
   - Booking ID
   - Rent amount
   - User ID (auto-filled)
3. ✓ Booking data properly loaded from sessionStorage/localStorage/API

### Step 3: Test Refund Request (UPI)
1. On mystays.html, click "Refund" button on booking card
2. Refund modal should open with booking details
3. Fill form fields:
   - **Name**: Your name (auto-filled or enter new)
   - **Phone**: Your phone (auto-filled or enter new)
   - **Request Type**: Select "Refund"
   - **Payment Method**: Select "UPI"
   - **UPI ID**: Enter your UPI ID (e.g., yourname@upi)
4. Click "Submit Request"
5. ✓ Success alert: "Request submitted!"
6. ✓ Modal closes and bookings reload

### Step 4: Verify Request in Admin Panel
1. Open `superadmin/refund.html`
2. Page should load automatically and fetch refund requests
3. You should see your refund request in the table with:
   - Request ID (first 8 chars of MongoDB ID)
   - Tenant name and booking ID
   - Refund amount: ₹500
   - Request type: "Refund"
   - Payment method: UPI badge with your UPI ID
   - Status: "Pending" (yellow badge)
   - Date submitted
4. ✓ Table populated with correct data from API

### Step 5: Test Alternative Property Request
1. Go back to mystays.html
2. Click "Alternative Property" button on booking card
3. Fill form fields:
   - **Name & Phone**: Your details
   - **Request Type**: Select "Alternative Property"
   - **Preferred Area**: Enter area (e.g., "Indiranagar")
   - **Property Requirements**: Enter requirements (e.g., "2BHK, furnished")
4. Click "Submit Request"
5. ✓ Success alert shown
6. Go to refund.html
7. ✓ New request appears with:
   - Request Type: "Alternative Property"
   - No payment method shown (N/A)
   - Status: "Pending"

### Step 6: Test Bank Transfer Request
1. Click "Refund" button again (create another refund request)
2. Fill form fields:
   - **Name & Phone**: Your details
   - **Request Type**: "Refund"
   - **Payment Method**: "Bank"
   - **Bank Account Holder**: Your name
   - **Bank Account Number**: Your account number
   - **IFSC Code**: Your bank's IFSC
   - **Bank Name**: Your bank name
3. Click "Submit Request"
4. ✓ Request appears in admin panel with:
   - Payment Method: Bank badge showing account details

### Step 7: Test Admin Actions
1. In superadmin/refund.html, find your refund request
2. Click row to view details modal
3. Modal should show complete information:
   - All refund details
   - Payment method details
   - User contact info
4. Click "Approve" button
5. ✓ Status changes to "Approved" (green badge)
6. Click "Approve" again to "Process"
7. ✓ Status changes to "Processed"
8. ✓ Admin notes saved

### Step 8: Test Rejection
1. Create another refund request from mystays.html
2. Go to admin panel
3. Click on the new request
4. Click "Reject" button
5. ✓ Status changes to "Rejected" (red badge)

### Step 9: Test API Error Handling
1. Close your backend/API server (simulate outage)
2. Try submitting a refund request from mystays.html
3. ✓ Should show: "Request saved locally, will sync when available"
4. ✓ Request saved to localStorage('refundSubmissions')
5. Restart backend
6. Refresh superadmin/refund.html
7. ✓ Should now load refund requests from API

### Step 10: Test Table Filtering
1. In superadmin/refund.html, check:
   - Stats cards update correctly (Pending, Processed counts)
   - Table shows all requests
   - Search bar works (if implemented)
   - Status filters work (if implemented)

## Expected Data Flow

```
User fills booking form
         ↓
Payment gateway (Razorpay)
         ↓
Booking saved to DB
         ↓
mystays.html loads booking
         ↓
User clicks "Refund"/"Alternative Property"
         ↓
User fills refund form details
         ↓
submitRefundRequest() validates & sends to API
         ↓
POST /api/booking/refund-request (backend)
         ↓
RefundRequest saved to MongoDB
         ↓
superadmin/refund.html fetches requests
         ↓
GET /api/booking/refund-requests (backend)
         ↓
Admin sees refund in table
         ↓
Admin clicks to view details and process
         ↓
POST /api/booking/refund-request/{id}/process
         ↓
Refund processed (money refunded to UPI/Bank)
         ↓
User can track status in mystays.html (future)
```

## Key Fields Being Captured

### From booking-form.html
- booking_id (MongoDB ObjectId)
- property_id
- property_name
- property_image
- rent_amount
- user_id
- payment_id (from Razorpay)

### From refund modal (mystays.html)
- user_name
- user_phone
- user_email
- request_type (refund or alternative_property)
- refund_method (upi or bank)
- upi_id (if UPI)
- bank_account_holder, bank_account_number, bank_ifsc_code, bank_name (if bank)
- preferred_area (if alternative_property)
- property_requirements (if alternative_property)

### Stored in MongoDB
All above fields plus:
- refund_status (pending → approved → processed/rejected)
- created_at (timestamp)
- updated_at (timestamp)
- admin_notes (from admin)
- refund_transaction_id (after processing)

## Validation Rules

### Name & Phone (Always Required)
- ✓ Name: Must be non-empty, at least 3 characters
- ✓ Phone: Must be valid, 10 digits

### For Refund Requests
- ✓ Refund Method: Must select UPI or Bank
- ✓ If UPI: UPI ID must be valid format (user@bank)
- ✓ If Bank: All fields required (holder, account, IFSC, bank name)

### For Alternative Property Requests
- ✓ Preferred Area: Optional but recommended
- ✓ Property Requirements: Optional but recommended

## Console Debugging

When testing, check browser console (F12) for:

1. **Submission Logs**
   ```
   ✅ Refund request submitted successfully: {response data}
   ```

2. **API Errors**
   ```
   ❌ API error: {error message}
   ```

3. **Local Storage**
   ```
   JSON.parse(localStorage.getItem('refundSubmissions'))
   // Shows all local refund submissions
   ```

4. **Network Tab**
   - Look for `POST /api/booking/refund-request`
   - Look for `GET /api/booking/refund-requests`
   - Check status codes (200 = success, 400 = validation error, 500 = server error)

## Common Issues & Solutions

### Issue: Refund request not appearing in admin panel
**Solution**:
1. Check browser console for API errors
2. Verify API_URL in refund.html is correct
3. Check MongoDB for `refund_requests` collection
4. Ensure GET /api/booking/refund-requests works in Postman

### Issue: Form showing validation errors
**Solution**:
1. Ensure all required fields are filled
2. For bank method, enter all 4 bank fields
3. For UPI, enter valid format (user@bank)
4. Check console for specific validation message

### Issue: Button stays in "Submitting" state
**Solution**:
1. Check API response status
2. Verify backend is running on localhost:5001
3. Check CORS configuration

### Issue: Data not saved locally
**Solution**:
1. Check localStorage is enabled in browser
2. Try clearing localStorage and retrying
3. Check browser storage limits

## Files to Monitor

1. **website/mystays.html**
   - Check `submitRefundRequest()` function
   - Check `loadUserBookings()` and `displayBookings()`
   - Monitor localStorage('refundSubmissions')

2. **superadmin/refund.html**
   - Check `loadRefundRequests()` function
   - Monitor `allRefundRequests` variable
   - Check table rendering in browser DevTools

3. **roomhy-backend/controllers/bookingController.js**
   - Check request validation logic
   - Monitor MongoDB operations
   - Check response formatting

4. **MongoDB**
   - Collection: `bookings` - booking records
   - Collection: `refund_requests` - refund request records

## Success Criteria

✅ **When complete, you should be able to**:
1. Create a booking with payment
2. View booking on mystays.html
3. Submit refund request (UPI or Bank)
4. See refund request appear in admin panel within seconds
5. Admin can view, approve, and process refund
6. Status updates in real-time
7. Alternative property requests work
8. Form validation prevents invalid submissions
9. API errors are handled gracefully
10. Local storage works as backup

## Next Steps After Testing

1. ✅ Add user notifications when refund status changes
2. ✅ Display refund status on mystays.html booking cards
3. ✅ Add refund history page for users
4. ✅ Email notifications to user
5. ✅ Automated refund processing for approved requests
6. ✅ Offline sync for locally saved submissions

---

**Status**: Implementation Complete - Ready to Test
**Last Updated**: 2024
