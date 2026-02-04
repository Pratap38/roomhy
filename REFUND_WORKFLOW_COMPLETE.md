# Complete Refund Workflow Documentation

## Overview
This document describes the complete end-to-end workflow for refund and alternative property requests in the RoomHy platform.

## Data Flow Diagram

```
┌─────────────────────┐
│  booking-form.html  │ ← User creates booking with payment
└──────────┬──────────┘
           │
           ├─ Captures: booking_id, property_id, propertyImage, rentAmount, user_id
           ├─ Captures: payment_id (from Razorpay/payment gateway)
           │
           └─→ Save to: sessionStorage('bookingConfirmation')
                        localStorage('lastBooking')
                        Backend: MongoDB bookings collection
                        
┌─────────────────────┐
│ mystays.html        │ ← User views their bookings
└──────────┬──────────┘
           │
           ├─ loadUserBookings() fetches from:
           │   1. sessionStorage
           │   2. localStorage
           │   3. GET /api/bookings/user/{userId}
           │
           ├─ displayBookings() shows booking cards
           │
           └─→ User clicks "Refund" or "Alternative Property"
               openRefundModal(bookingIndex)
               
┌──────────────────────────────────┐
│ Refund Modal Opens               │
└──────────┬───────────────────────┘
           │
           ├─ selectedBooking = userBookings[bookingIndex]
           │
           ├─ Pre-fill form with:
           │   - user_name (from booking or form input)
           │   - user_phone (from booking or form input)
           │   - user_email (from booking)
           │
           ├─ If requestType == 'refund':
           │   ├─ Show refund method selection: UPI or Bank
           │   ├─ Collect: upi_id (for UPI)
           │   ├─ Collect: bank_account_holder, bank_account_number, bank_ifsc_code, bank_name
           │   │
           │   └─ For UPI: ✓ Validate UPI ID format
           │                ✓ Validate Bank details if bank selected
           │
           └─ If requestType == 'alternative_property':
               ├─ Collect: preferred_area
               └─ Collect: property_requirements

┌──────────────────────────────────┐
│ User Submits Refund Request      │
└──────────┬───────────────────────┘
           │
           └─→ submitRefundRequest()
               │
               ├─ Validate all required fields
               ├─ Build refundPayload with:
               │   {
               │     booking_id: selectedBooking._id,
               │     user_id: selectedBooking.user_id,
               │     payment_id: selectedBooking.paymentId,
               │     user_name: name,
               │     user_phone: phone,
               │     user_email: email,
               │     request_type: 'refund' | 'alternative_property',
               │     refund_method: 'upi' | 'bank' | null,
               │     upi_id: upi_id | null,
               │     bank_account_holder: account_holder | null,
               │     bank_account_number: account_number | null,
               │     bank_ifsc_code: ifsc_code | null,
               │     bank_name: bank_name | null,
               │     preferred_area: area | null,
               │     property_requirements: requirements | null
               │   }
               │
               ├─ POST /api/booking/refund-request
               │   │
               │   ├─ Success:
               │   │  ├─ API creates RefundRequest in MongoDB
               │   │  ├─ Sets default status: 'pending'
               │   │  ├─ Stores local copy in localStorage('refundSubmissions')
               │   │  ├─ Show success alert: "Request submitted successfully!"
               │   │  └─ closeRefundModal() & reload bookings
               │   │
               │   └─ Failure (API unavailable):
               │      ├─ Store locally in localStorage('refundSubmissions')
               │      ├─ Mark as status: 'pending_sync'
               │      ├─ Show: "Request saved locally, will sync when available"
               │      └─ closeRefundModal() & reload bookings
               │
               └─→ Cleanup:
                   ├─ Clear form fields
                   ├─ Reset submit button state
                   └─ Show confirmation to user

┌───────────────────────────────────────┐
│ Backend Processing                    │
│ POST /api/booking/refund-request      │
└──────────┬────────────────────────────┘
           │
           ├─ Validate request payload
           ├─ Create new RefundRequest document in MongoDB
           ├─ Set initial status: 'pending'
           ├─ Auto-generate refund request ID
           ├─ Set created_at: current timestamp
           │
           └─→ Save to MongoDB: refund_requests collection
               {
                 _id: ObjectId,
                 booking_id: String,
                 user_id: String,
                 payment_id: String,
                 property_id: String (optional),
                 property_name: String (optional),
                 refund_amount: Number,
                 user_name: String,
                 user_phone: String,
                 user_email: String,
                 request_type: 'refund' | 'alternative_property',
                 refund_method: 'upi' | 'bank' | null,
                 upi_id: String (if UPI),
                 bank_account_holder: String (if bank),
                 bank_account_number: String (if bank),
                 bank_ifsc_code: String (if bank),
                 bank_name: String (if bank),
                 preferred_area: String (if alternative),
                 property_requirements: String (if alternative),
                 refund_status: 'pending' | 'approved' | 'rejected' | 'processed',
                 admin_notes: String,
                 created_at: Date,
                 updated_at: Date
               }

┌─────────────────────────────────────────┐
│ SuperAdmin Views Refund Requests        │
│ superadmin/refund.html                  │
└──────────┬────────────────────────────────┘
           │
           ├─ Page loads:
           │   └─ JavaScript calls: loadRefundRequests()
           │
           └─→ loadRefundRequests()
               │
               ├─ GET /api/booking/refund-requests
               │  │
               │  └─ Response:
               │     {
               │       success: true,
               │       count: 15,
               │       data: [
               │         { _id, booking_id, user_name, refund_amount, request_type, refund_status, created_at, ... },
               │         ...
               │       ]
               │     }
               │
               ├─ Store in JavaScript: allRefundRequests = data.data
               │
               ├─ Call displayRefundRequests(allRefundRequests)
               │  │
               │  └─ Render table rows with:
               │     ├─ Request ID (first 8 chars of _id)
               │     ├─ Tenant Details (name, user avatar, booking_id)
               │     ├─ Refund Amount (₹500 or actual amount)
               │     ├─ Request Type (Refund or Alternative Property)
               │     ├─ Payment Method (UPI badge with ID, or Bank badge with account)
               │     ├─ Date Requested (formatted date)
               │     ├─ Status (Pending/Approved/Rejected/Processed badge)
               │     └─ Actions (View Details, Approve, Reject buttons)
               │
               └─→ Call updateRefundStats(allRefundRequests)
                   ├─ Count pending requests
                   ├─ Count processed/approved requests
                   ├─ Count rejected requests
                   ├─ Calculate total amounts
                   └─ Update stats cards at top of page

┌──────────────────────────────────────┐
│ Admin Processes Refund Request       │
│ (Click on refund row)                │
└──────────┬─────────────────────────────┘
           │
           ├─ Admin clicks "View Details"
           │  └─ toggleModal() shows refund details modal
           │     ├─ Display full refund request information
           │     ├─ Show user details
           │     ├─ Show payment method details
           │     ├─ Show previous refund history (if any)
           │     │
           │     └─ Admin can:
           │        ├─ Add admin notes/comments
           │        ├─ Click "Approve" button
           │        └─ Click "Reject" button
           │
           └─→ If Admin Clicks "Approve":
               │
               └─→ processRefund(refundId)
                   │
                   ├─ POST /api/booking/refund-request/{id}/process
                   │
                   ├─ Backend processes refund:
                   │  ├─ Fetch RefundRequest document
                   │  ├─ Check payment_id with Razorpay
                   │  ├─ Create refund transaction
                   │  ├─ Send money back to:
                   │     - UPI ID (if UPI method)
                   │     - Bank account (if bank method)
                   │  ├─ Update refund_status: 'processed'
                   │  ├─ Record transaction details
                   │  └─ Send notification email to user
                   │
                   └─→ Frontend:
                       ├─ Show success alert: "Refund processed successfully!"
                       ├─ Update table row status to "Processed"
                       ├─ Refresh refund list
                       └─ Send user notification

┌──────────────────────────────────────┐
│ Admin Rejects Refund Request         │
└──────────┬─────────────────────────────┘
           │
           └─→ rejectRefund(refundId)
               │
               ├─ PUT /api/booking/refund-request/{id}/status
               │  └─ Payload: { refund_status: 'rejected', admin_notes: 'reason...' }
               │
               ├─ Backend:
               │  ├─ Update RefundRequest.refund_status = 'rejected'
               │  ├─ Store admin notes
               │  ├─ Send rejection notification email to user
               │  └─ Log rejection in audit trail
               │
               └─→ Frontend:
                   ├─ Show success alert: "Refund rejected"
                   ├─ Update table row status to "Rejected"
                   └─ Refresh refund list

┌──────────────────────────────────────┐
│ User Tracking (Future)               │
│ mystays.html - View refund status    │
└──────────────────────────────────────┘
           │
           └─→ On booking card:
               ├─ Show "Refund Status" badge
               ├─ Display: Pending/Approved/Rejected/Processed
               ├─ Show expected refund date (if processed)
               └─ Show refund transaction reference (if processed)
```

## Key API Endpoints

### 1. Create Refund Request
- **Endpoint**: `POST /api/booking/refund-request`
- **Source**: website/mystays.html
- **Required Fields**:
  - `booking_id` (String): MongoDB ObjectId of booking
  - `user_id` (String): User's ID
  - `payment_id` (String): Payment gateway transaction ID
  - `user_name` (String): Tenant name
  - `user_phone` (String): Tenant phone
  - `request_type` (String): 'refund' or 'alternative_property'
  - `refund_method` (String): 'upi', 'bank', or null (for alternative property)
- **Optional Fields**:
  - `upi_id` (String): UPI ID for refund
  - `bank_account_holder` (String): Account holder name
  - `bank_account_number` (String): Bank account number
  - `bank_ifsc_code` (String): IFSC code
  - `bank_name` (String): Bank name
  - `preferred_area` (String): Area preference for alternative property
  - `property_requirements` (String): Requirements for alternative property
- **Response**:
  ```json
  {
    "success": true,
    "message": "Refund request created successfully",
    "data": {
      "_id": "ObjectId",
      "booking_id": "...",
      "refund_status": "pending",
      "created_at": "ISO date",
      ...
    }
  }
  ```

### 2. Get All Refund Requests
- **Endpoint**: `GET /api/booking/refund-requests`
- **Source**: superadmin/refund.html
- **Query Parameters** (optional):
  - `status`: Filter by refund_status (pending, approved, rejected, processed)
  - `request_type`: Filter by request_type (refund, alternative_property)
- **Response**:
  ```json
  {
    "success": true,
    "count": 15,
    "data": [
      {
        "_id": "ObjectId",
        "booking_id": "...",
        "user_name": "...",
        "user_phone": "...",
        "refund_amount": 500,
        "request_type": "refund",
        "refund_method": "upi",
        "upi_id": "...",
        "refund_status": "pending",
        "created_at": "ISO date",
        ...
      },
      ...
    ]
  }
  ```

### 3. Process Refund (Admin Approval)
- **Endpoint**: `POST /api/booking/refund-request/{id}/process`
- **Source**: superadmin/refund.html (admin action)
- **Payload**:
  ```json
  {
    "admin_notes": "Refund approved and processed"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Refund processed successfully",
    "data": {
      "refund_status": "processed",
      "refund_transaction_id": "...",
      "processed_at": "ISO date"
    }
  }
  ```

### 4. Update Refund Status (Reject)
- **Endpoint**: `PUT /api/booking/refund-request/{id}/status`
- **Source**: superadmin/refund.html (admin action)
- **Payload**:
  ```json
  {
    "refund_status": "rejected",
    "admin_notes": "Reason for rejection..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Refund status updated",
    "data": {
      "refund_status": "rejected",
      "updated_at": "ISO date"
    }
  }
  ```

## Data Storage Locations

### Client-Side (Browser)
1. **sessionStorage** - Temporary (until tab closes)
   - `bookingConfirmation`: Current booking details
   - `userId`: Current user's ID
   
2. **localStorage** - Persistent (until cleared)
   - `lastBooking`: Last booking created
   - `userId`: User's ID
   - `refundSubmissions`: Array of submitted refund requests (for offline support)

### Server-Side (MongoDB)
1. **bookings collection** - Booking records
   - Created by booking-form.html
   - Read by mystays.html via GET /api/bookings/user/{userId}
   
2. **refund_requests collection** - Refund/alternative property requests
   - Created by mystays.html via POST /api/booking/refund-request
   - Read by superadmin/refund.html via GET /api/booking/refund-requests
   - Updated by admin via PUT /POST endpoints

## Complete Data Structure: RefundRequest

```javascript
{
  _id: ObjectId,                          // Auto-generated MongoDB ID
  
  // Reference IDs
  booking_id: String,                     // MongoDB ObjectId of booking
  user_id: String,                        // User's ID
  payment_id: String,                     // Payment gateway transaction ID
  property_id: String,                    // Property ID (optional)
  property_name: String,                  // Property name (optional)
  
  // User Information
  user_name: String,                      // Tenant name
  user_phone: String,                     // Contact phone
  user_email: String,                     // Email address
  
  // Request Details
  request_type: String,                   // 'refund' or 'alternative_property'
  refund_amount: Number,                  // Amount to refund (default: 500)
  
  // Refund Method (if request_type === 'refund')
  refund_method: String,                  // 'upi', 'bank', or null
  upi_id: String,                         // UPI ID (if method is 'upi')
  bank_account_holder: String,            // Account holder name (if method is 'bank')
  bank_account_number: String,            // Account number (if method is 'bank')
  bank_ifsc_code: String,                 // IFSC code (if method is 'bank')
  bank_name: String,                      // Bank name (if method is 'bank')
  
  // Alternative Property Details (if request_type === 'alternative_property')
  preferred_area: String,                 // Preferred area for new property
  property_requirements: String,          // Specific requirements
  
  // Status & Tracking
  refund_status: String,                  // 'pending', 'approved', 'rejected', 'processed'
  refund_transaction_id: String,          // Transaction ID after processing
  admin_notes: String,                    // Notes from admin
  
  // Timestamps
  created_at: Date,                       // Request creation time
  updated_at: Date,                       // Last update time
  processed_at: Date                      // When refund was processed
}
```

## Implementation Checklist

### Frontend (mystays.html)
- [x] Refund modal UI created
- [x] Form fields for name, phone, payment method
- [x] UPI/Bank details collection
- [x] Alternative property fields
- [x] submitRefundRequest() function implemented
- [x] API call to POST /api/booking/refund-request
- [x] Local storage backup (localStorage('refundSubmissions'))
- [x] Success/error notifications
- [x] Form validation
- [x] Loading state during submission

### Backend (bookingController.js)
- [x] createRefundRequest() endpoint
- [x] getAllRefundRequests() endpoint
- [x] getRefundRequestById() endpoint
- [x] processRefund() endpoint
- [x] updateRefundStatus() endpoint
- [x] RefundRequest model schema
- [x] Field validation
- [x] Error handling

### Admin Panel (superadmin/refund.html)
- [x] Page layout and styling
- [x] Sidebar navigation
- [x] Stats cards (Pending, Processed, Rejected)
- [x] Refund requests table
- [x] loadRefundRequests() function
- [x] displayRefundRequests() function
- [x] updateRefundStats() function
- [x] Refund details modal
- [x] processRefund() function
- [x] rejectRefund() function
- [x] Search/filter functionality
- [x] Action buttons

### Testing
- [ ] Create booking in booking-form.html
- [ ] Complete payment successfully
- [ ] Verify booking appears in mystays.html
- [ ] Submit refund request from mystays.html
- [ ] Verify refund request appears in superadmin/refund.html
- [ ] Admin approves refund
- [ ] Verify refund status updates
- [ ] Test UPI refund
- [ ] Test Bank refund
- [ ] Test Alternative Property request

## Troubleshooting

### Refund request not appearing in admin panel
1. Check browser console for API errors
2. Verify GET /api/booking/refund-requests returns data
3. Check MongoDB refund_requests collection has documents
4. Verify API_URL is correct in superadmin/refund.html
5. Check CORS settings allow requests from superadmin domain

### submitRefundRequest() not sending data
1. Check selectedBooking is populated correctly
2. Verify required fields (name, phone) are filled
3. Check browser console Network tab for POST request
4. Verify API URL in mystays.html is correct
5. Check API response for validation errors

### Refund status not updating
1. Verify admin user has permissions
2. Check MongoDB connection
3. Verify refund_status field is being updated
4. Check logs for any errors during processing

### User not receiving notifications
1. Check user_email in refund request is correct
2. Verify email service is configured
3. Check notification queue for pending messages
4. Verify admin email notification is enabled

## Files Modified/Created

1. **website/mystays.html**
   - Updated: submitRefundRequest() function
   - Added: Form validation and error handling
   - Added: Local storage backup system
   - Added: Better user notifications

2. **superadmin/refund.html**
   - Existing: Complete implementation already in place
   - Uses: GET /api/booking/refund-requests to load data
   - Uses: POST/PUT endpoints to process requests

3. **roomhy-backend/controllers/bookingController.js**
   - Existing: All refund endpoints implemented
   - createRefundRequest()
   - getAllRefundRequests()
   - getRefundRequestById()
   - processRefund()
   - Status update endpoints

4. **roomhy-backend/models/RefundRequest.js**
   - Existing: Schema defined with all required fields

## Next Steps

1. **Testing**: Follow testing checklist above
2. **Notifications**: Add email notifications when refund status changes
3. **User Tracking**: Add refund status display on mystays.html booking cards
4. **Analytics**: Add refund analytics to superadmin dashboard
5. **Automated Processing**: Implement scheduled processing of approved refunds
6. **Offline Sync**: Implement sync logic for locally saved refund submissions

---

**Last Updated**: 2024
**Status**: Implementation Complete - Ready for Testing
