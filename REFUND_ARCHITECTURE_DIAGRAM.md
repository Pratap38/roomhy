# Refund Workflow - Visual Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROOMHY REFUND SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER (Browser)                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐         ┌──────────────────────┐                │
│  │  booking-form.html   │         │  mystays.html        │                │
│  │                      │         │                      │                │
│  │  • Booking capture   │────────→│  • Display bookings  │                │
│  │  • Payment gateway   │         │  • Refund modal      │                │
│  │  • Property details  │         │  • Submit refund     │                │
│  │  • Save to Storage   │         │  • Alternative prop  │                │
│  └──────────────────────┘         └──────┬───────────────┘                │
│                                           │                                 │
│                                           ├─→ localStorage                  │
│                                           │   ('refundSubmissions')         │
│                                           │                                 │
│                                           └─→ sessionStorage                │
│                                               ('bookingConfirmation')       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
        ┌───────────▼────────────┐     ┌───────────▼──────────┐
        │  POST Request          │     │  Offline Fallback    │
        │  /api/booking/         │     │  (Local Storage)     │
        │  refund-request        │     │                      │
        │                        │     │  Syncs when API      │
        │                        │     │  comes back online   │
        │                        │     │                      │
        └───────────┬────────────┘     └───────────┬──────────┘
                    │                              │
                    └──────────────┬───────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│ BACKEND LAYER (Node.js/Express on localhost:5001)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API Routes: /api/booking/                                             │ │
│  │                                                                        │ │
│  │  POST /refund-request              → createRefundRequest()           │ │
│  │  GET  /refund-requests             → getAllRefundRequests()          │ │
│  │  GET  /refund-request/:id          → getRefundRequestById()          │ │
│  │  POST /refund-request/:id/process  → processRefund()                 │ │
│  │  PUT  /refund-request/:id/status   → updateRefundStatus()            │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Business Logic: bookingController.js                                  │ │
│  │                                                                        │ │
│  │  ✓ Validate refund payload                                           │ │
│  │  ✓ Process payment (UPI/Bank)                                        │ │
│  │  ✓ Generate transaction IDs                                          │ │
│  │  ✓ Send notifications                                                │ │
│  │  ✓ Audit logging                                                     │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│ DATA LAYER (MongoDB)                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────┐      ┌────────────────────────────┐       │
│  │ Collection: bookings       │      │ Collection: refund_requests│       │
│  │                            │      │                            │       │
│  │ _id: ObjectId              │      │ _id: ObjectId              │       │
│  │ booking_id: String         │──┬──→│ booking_id: String         │       │
│  │ user_id: String            │  │   │ user_id: String            │       │
│  │ property_id: String        │  │   │ payment_id: String         │       │
│  │ payment_id: String         │  │   │ request_type: String       │       │
│  │ rent_amount: Number        │  │   │ refund_method: String      │       │
│  │ created_at: Date           │  │   │ refund_amount: Number      │       │
│  │                            │  │   │ refund_status: String      │       │
│  │                            │  │   │ created_at: Date           │       │
│  │                            │  │   │ processed_at: Date         │       │
│  │                            │  │   │                            │       │
│  └────────────────────────────┘  │   └────────────────────────────┘       │
│                                  │                                         │
│                            ┌─────┴──────┐                                 │
│                            │ References │                                 │
│                            └────────────┘                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
        ┌───────────▼────────────┐     ┌────────▼──────────┐
        │  GET Request           │     │  Admin Dashboard  │
        │  /api/booking/         │     │  superadmin/      │
        │  refund-requests       │     │  refund.html      │
        │                        │     │                   │
        │                        │     │                   │
        └────────────┬───────────┘     └────────┬──────────┘
                     │                          │
                     └──────────────┬───────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────────────┐
│ ADMIN INTERFACE (superadmin/refund.html)                                    │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Header: Statistics Cards                                               ││
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 ││
│  │ │ Pending: 5   │  │ Processed: 2 │  │ Rejected: 1  │                 ││
│  │ │ ₹2,500 Total │  │ ₹1,000 Total │  │ ₹500 Total   │                 ││
│  │ └──────────────┘  └──────────────┘  └──────────────┘                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Table: All Refund Requests                                             ││
│  │                                                                          ││
│  │ ┌─────┬──────────┬────────┬──────────┬──────────┬────────┬────────┬─────┐│
│  │ │ ID  │ Tenant   │ Amount │ Type     │ Method   │ Date   │ Status │ Act ││
│  │ ├─────┼──────────┼────────┼──────────┼──────────┼────────┼────────┼─────┤│
│  │ │#A1B │ John Doe │ ₹500   │ Refund   │ UPI:12.. │ 3d ago │ Pending│ ... ││
│  │ │#C2D │ Jane Smith│ ₹500   │ Alt.Prop │ N/A      │ 2d ago │ Pending│ ... ││
│  │ │#E3F │ Bob Dark │ ₹500   │ Refund   │ Bank:123 │ 1d ago │ Approved│ ...││
│  │ │     │          │        │          │          │        │        │     ││
│  │ └─────┴──────────┴────────┴──────────┴──────────┴────────┴────────┴─────┘│
│  │                                                                          │
│  │ Click on row → View Details Modal                                      │
│  │                ├─ Full refund information                              │
│  │                ├─ User contact details                                 │
│  │                ├─ Payment method details                               │
│  │                ├─ Action: Approve → Process                            │
│  │                └─ Action: Reject with reason                           │
│  │                                                                          │
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Details

### 1. Refund Request Submission Flow

```
User on mystays.html
    │
    ├─ Opens booking card
    │
    ├─ Clicks "Refund" button
    │  └─ openRefundModal(bookingIndex)
    │     └─ selectedBooking = userBookings[bookingIndex]
    │        └─ Modal displays with pre-filled data:
    │           ├─ user_name (from booking or form)
    │           ├─ user_phone (from booking or form)
    │           ├─ user_email (from booking)
    │           └─ booking_id, user_id, payment_id (auto)
    │
    ├─ User enters additional details:
    │  ├─ Payment Method (UPI or Bank)
    │  ├─ UPI ID or Bank Account details
    │  └─ Alternative area/requirements (if applicable)
    │
    ├─ Clicks "Submit Request"
    │  └─ submitRefundRequest() executed
    │     │
    │     ├─ Validate all fields
    │     │  ├─ Check name & phone not empty
    │     │  ├─ Check refund method selected (if refund)
    │     │  ├─ Validate UPI format
    │     │  └─ Validate bank details
    │     │
    │     ├─ Build refundPayload
    │     │  {
    │     │    booking_id, user_id, payment_id,
    │     │    user_name, user_phone, user_email,
    │     │    request_type, refund_method,
    │     │    upi_id, bank_*, preferred_area, requirements
    │     │  }
    │     │
    │     ├─ Show loading: "Submitting..."
    │     │
    │     ├─ POST /api/booking/refund-request
    │     │  │
    │     │  ├─ Success (200):
    │     │  │  ├─ Save to localStorage('refundSubmissions')
    │     │  │  ├─ Show: "Request submitted!"
    │     │  │  ├─ Close modal
    │     │  │  └─ Reload bookings
    │     │  │
    │     │  └─ Failure (Network/API error):
    │     │     ├─ Save to localStorage('refundSubmissions')
    │     │     ├─ Mark as: status = 'pending_sync'
    │     │     ├─ Show: "Saved locally, will sync online"
    │     │     ├─ Close modal
    │     │     └─ Reload bookings
    │     │
    │     └─ Reset button state
    │
    └─ Modal closes, user sees booking list
```

### 2. Admin Review Flow

```
Admin opens superadmin/refund.html
    │
    ├─ Page loads
    │  └─ loadRefundRequests() called automatically
    │     │
    │     ├─ GET /api/booking/refund-requests?status=pending
    │     │  └─ Backend returns all refund requests
    │     │
    │     ├─ Store in: allRefundRequests = data.data
    │     │
    │     ├─ Call displayRefundRequests(allRefundRequests)
    │     │  └─ Generate HTML table rows
    │     │     ├─ Request ID, Tenant name, Amount
    │     │     ├─ Request Type, Payment Method
    │     │     ├─ Date, Status, Actions
    │     │     └─ Add click handlers
    │     │
    │     └─ Call updateRefundStats(allRefundRequests)
    │        ├─ Count pending: 5 → "Pending: 5 | ₹2,500"
    │        ├─ Count approved: 2 → "Approved: 2 | ₹1,000"
    │        └─ Count rejected: 1 → "Rejected: 1 | ₹500"
    │
    ├─ Admin views table with all pending refunds
    │
    ├─ Admin clicks on a row
    │  └─ toggleModal(refundId)
    │     └─ Modal shows:
    │        ├─ Full refund request details
    │        ├─ User: Name, Phone, Email
    │        ├─ Payment: Method (UPI/Bank), Details
    │        ├─ Amount: ₹500
    │        ├─ Request Type: Refund or Alternative
    │        └─ Admin can: Approve or Reject
    │
    ├─ If Admin Clicks "Approve"
    │  └─ approveRefund(refundId)
    │     │
    │     ├─ PUT /api/booking/refund-request/{id}/status
    │     │  └─ Payload: { refund_status: 'approved' }
    │     │
    │     ├─ Backend updates status in MongoDB
    │     │
    │     ├─ Show: "Approved successfully"
    │     │
    │     └─ Reload table (status now shows "Approved")
    │
    ├─ If Admin Clicks "Process"
    │  └─ processRefund(refundId)
    │     │
    │     ├─ POST /api/booking/refund-request/{id}/process
    │     │  └─ Payload: { admin_notes: "..." }
    │     │
    │     ├─ Backend:
    │     │  ├─ Validates refund details
    │     │  ├─ Connects to payment gateway (Razorpay)
    │     │  ├─ Creates refund transaction
    │     │  ├─ Sends money to UPI/Bank
    │     │  ├─ Updates status: 'processed'
    │     │  ├─ Stores transaction ID
    │     │  └─ Sends email to user
    │     │
    │     ├─ Show: "Refund processed successfully"
    │     │
    │     └─ Reload table (status now shows "Processed")
    │
    ├─ If Admin Clicks "Reject"
    │  └─ rejectRefund(refundId)
    │     │
    │     ├─ PUT /api/booking/refund-request/{id}/status
    │     │  └─ Payload: {
    │     │       refund_status: 'rejected',
    │     │       admin_notes: 'Reason for rejection...'
    │     │     }
    │     │
    │     ├─ Backend updates status in MongoDB
    │     │
    │     ├─ Send rejection email to user
    │     │
    │     ├─ Show: "Refund rejected"
    │     │
    │     └─ Reload table (status now shows "Rejected")
    │
    └─ Admin continues reviewing other refunds
```

## Data Transformation Flow

```
┌─────────────────────────────────────┐
│ Form Input (mystays.html)           │
│                                     │
│ Name: "John Doe"                   │
│ Phone: "9876543210"                │
│ UPI: "john@upi"                    │
│ Request Type: "Refund"             │
│                                     │
└──────────────┬──────────────────────┘
               │
               ├─ Validation
               │  ├─ Name length check
               │  ├─ Phone format check
               │  ├─ UPI format check
               │  └─ Required fields check
               │
               ├─ Data Enrichment
               │  ├─ Add: booking_id from selectedBooking
               │  ├─ Add: user_id from storage
               │  ├─ Add: payment_id from selectedBooking
               │  ├─ Add: timestamp
               │  └─ Add: default status = 'pending'
               │
               ├─ Formatting
               │  ├─ Trim whitespace
               │  ├─ Convert to proper types
               │  ├─ Null check for optional fields
               │  └─ Build JSON payload
               │
               ├─ Transmission
               │  ├─ POST to API endpoint
               │  ├─ JSON encoding
               │  └─ Headers: Content-Type: application/json
               │
               ├─ Backend Processing
               │  ├─ Receive payload
               │  ├─ Parse JSON
               │  ├─ Validate again (server-side)
               │  ├─ Create MongoDB document
               │  ├─ Set _id (auto)
               │  ├─ Set created_at (server time)
               │  └─ Return response
               │
               ├─ Database Storage
               │  ├─ Insert into refund_requests collection
               │  ├─ Index by booking_id
               │  ├─ Index by user_id
               │  ├─ Index by refund_status
               │  └─ Create timestamp indexes
               │
               ├─ Admin Retrieval
               │  ├─ GET /api/booking/refund-requests
               │  ├─ Query MongoDB (all or filtered)
               │  ├─ Return as JSON array
               │  ├─ Parse in JavaScript
               │  └─ Format for display
               │
               └─ Table Rendering
                  ├─ Map data fields to table columns
                  ├─ Format dates
                  ├─ Color-code status badges
                  ├─ Add action buttons
                  └─ Display in HTML table
```

## Status Lifecycle

```
┌─────────────┐
│   PENDING   │  ← Initial status when created
└──────┬──────┘
       │
       ├─────────────────────────────┬──────────────────────────┐
       │                             │                          │
       ▼                             ▼                          ▼
  ┌─────────┐              ┌──────────────┐          ┌─────────────┐
  │ APPROVED│              │  REJECTED    │          │  PENDING    │
  └────┬────┘              │              │          │   (Action)  │
       │         (User/Admin│ (Admin)      │          │ (Waiting)   │
       │          request)  │              │          │             │
       │                   └──────────────┘          └─────────────┘
       │
       ├──────────────────→ Email to user
       │                   "Refund approved"
       │
       ├──────────────────→ Process payment
       │                   (UPI/Bank transfer)
       │
       ├──────────────────→ Update status
       │
       ▼
  ┌──────────────┐
  │  PROCESSED   │  ← Final status after successful refund
  │              │     User receives money
  │ Status: ✓    │
  │ Date: 2024   │
  └──────────────┘
```

## Payment Method Data Structure

### UPI Refund
```
{
  refund_method: 'upi',
  upi_id: 'john.doe@upi',
  
  Rendered in Admin Panel:
  ┌─────────────────────────────┐
  │ UPI: john.doe@upi           │ ← Badge with tooltip
  └─────────────────────────────┘
}
```

### Bank Transfer
```
{
  refund_method: 'bank',
  bank_account_holder: 'John Doe',
  bank_account_number: '1234567890',
  bank_ifsc_code: 'HDFC0001234',
  bank_name: 'HDFC Bank',
  
  Rendered in Admin Panel:
  ┌──────────────────────────────────────────────────┐
  │ Bank: John Doe - 1234567890                      │ ← Hover for full details
  │ IFSC: HDFC0001234 | Bank: HDFC Bank             │
  └──────────────────────────────────────────────────┘
}
```

---

This architecture ensures a complete, scalable, and maintainable refund management system integrated throughout the RoomHy platform.
