# Booking Form & MyStays Integration Guide

## Overview
This document explains the complete flow of how user bookings are processed and displayed on the MyStays page with professional layout enhancements.

## 1. Booking Form Enhancement (booking-form.html)

### User ID Pre-fill Feature
**Requirement:** User ID should be auto-filled and cannot be edited by the user

**Implementation:**
```html
<div>
    <label class="form-label">User ID (Auto-filled) *</label>
    <input type="text" id="userId" class="form-input" placeholder="User ID" readonly 
           style="background-color: #f3f4f6; cursor: not-allowed; font-weight: 600; color: #4f46e5;">
</div>
```

**Function: `populateUserIdField()`**
- Automatically fills the userId field when the page loads
- Gets the user ID from the global `userId` variable (extracted from URL parameter or session storage)
- Styled as read-only with gray background and indigo text
- Called during page initialization in `DOMContentLoaded` event

**How it works:**
1. User is redirected to booking form with userId in URL: `/booking-form.html?userId=TESTUSER123`
2. `getBookingDetails()` extracts userId from URL parameter
3. `populateUserIdField()` fills the #userId input field
4. User cannot edit the field (readonly attribute prevents modification)

---

## 2. Booking Confirmation & Data Saving

### After Payment Success
When payment is completed through Razorpay:

1. **handlePaymentSuccess()** → Receives payment ID from Razorpay
2. **submitBookingForm()** → Validates form and sends booking data to backend
3. **displaySuccessScreen()** → Shows success message with credentials

### New: Data Persistence & Redirect
```javascript
// Save booking confirmation to sessionStorage
const bookingConfirmation = {
    bookingId: window.bookingIdForFetch || bookingDetails.booking_id,
    userId: userId,
    propertyName: bookingDetails?.property_name,
    propertyId: bookingDetails?.property_id,
    ownerName: bookingDetails?.owner_name,
    rentAmount: bookingDetails?.rent_amount,
    area: bookingDetails?.area,
    bookingDate: new Date().toISOString(),
    paymentId: paymentId,
    paymentStatus: 'completed',
    status: 'confirmed'
};

// Save to sessionStorage (for immediate display on MyStays)
sessionStorage.setItem('bookingConfirmation', JSON.stringify(bookingConfirmation));

// Also save to localStorage (as backup)
localStorage.setItem('lastBooking', JSON.stringify(bookingConfirmation));
```

**After 1 second, a button appears on the success screen:**
- Button text: "✅ View My Bookings on MyStays"
- On click: Redirects to `/website/mystays.html?userId={userId}`

---

## 3. MyStays Page Professional Layout

### Header Navigation
- **Logo & Title:** RoomHy with home icon
- **Navigation Links:** Home, Properties, My Stays (active), Contact
- **User Menu:** Logout button (red, top right)
- **Style:** Sticky header with shadow, white background

```html
<header class="header-nav">
    <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-2">
            <div class="bg-indigo-600 p-2 rounded-lg">
                <i data-lucide="home" class="w-6 h-6 text-white"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">RoomHy</h1>
        </div>
        <nav class="hidden md:flex items-center gap-8">
            <a href="/" class="nav-item">Home</a>
            <a href="/#properties" class="nav-item">Properties</a>
            <a href="/website/mystays.html" class="nav-item active">My Stays</a>
            <a href="/#contact" class="nav-item">Contact</a>
        </nav>
        <button onclick="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg">
            Logout
        </button>
    </div>
</header>
```

### Hero Section
- **Background:** Purple gradient (667eea to 764ba2)
- **Title:** "My Stays & Bookings"
- **Subtitle:** "View and manage your property bookings with ease"
- **Height:** 60px padding top/bottom

### Booking Cards Grid
- **Layout:** Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- **Card Content:**
  - Property image (fallback gradient)
  - Status badge (Confirmed/Upcoming/Completed) with color coding
  - Property name and location
  - Check-in and check-out dates
  - Total amount in bold purple
  - Booking ID
  - Action buttons: Refund & Alternative Property

### Footer
**4-Column Professional Layout:**

1. **About Column**
   - "About RoomHy" heading
   - Description of the platform

2. **Quick Links Column**
   - Home
   - Properties
   - My Stays
   - Contact

3. **Support Column**
   - Help Center
   - FAQ
   - Report an Issue
   - Contact Support

4. **Contact Info Column**
   - Email: support@roomhy.com
   - Phone: +91 98765 43210
   - Location: Mumbai, India

**Footer Bottom:**
- Copyright notice
- Legal links: Privacy Policy, Terms of Service, Cookie Policy

---

## 4. Loading Bookings with Priority

The `loadUserBookings(userId)` function uses a 3-tier fallback system:

### Priority 1: SessionStorage (Immediate)
```javascript
const bookingDataStr = sessionStorage.getItem('bookingConfirmation');
if (bookingDataStr) {
    bookings = [JSON.parse(bookingDataStr)];
}
```
- **Used for:** Recently completed bookings (within session)
- **Advantage:** Instant display, no API call needed
- **Lifespan:** Until browser tab is closed

### Priority 2: LocalStorage (Persistent)
```javascript
const localBooking = localStorage.getItem('lastBooking');
if (localBooking) {
    bookings = [JSON.parse(localBooking)];
}
```
- **Used for:** Last booking even after closing browser
- **Advantage:** Persistent across sessions
- **Lifespan:** Indefinite (until cleared)

### Priority 3: API (Complete List)
```javascript
const response = await fetch(`${API_URL}/api/bookings/user/${userId}`);
const data = await response.json();
bookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
```
- **Used for:** Complete booking history from database
- **Advantage:** All historical bookings
- **Lifespan:** Server data (persistent)

---

## 5. Logout Function

```javascript
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all user data
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        localStorage.removeItem('roomhy_user_session');
        localStorage.removeItem('bookingConfirmation');
        sessionStorage.removeItem('bookingConfirmation');
        localStorage.removeItem('lastBooking');
        
        // Redirect to home
        window.location.href = '/';
    }
}
```

**Clears:**
- userId (localStorage & sessionStorage)
- Session data
- All booking data
- Redirects to home page

---

## 6. Complete User Journey

### Step-by-Step Flow

1. **User Registration/Login**
   - User completes signup on `new_signups.html`
   - System assigns or retrieves userId

2. **Browse Properties**
   - User views properties on main site
   - Clicks "Book Now" button on a property

3. **Booking Form**
   - Redirected to `/booking-form.html?userId={userId}`
   - userId field auto-populated with read-only value
   - User fills in personal information:
     - Full Name
     - Phone Number
     - Email Address
     - Guardian Name & Phone
     - Address details
   - Uploads address proof documents

4. **Payment**
   - User enters rent amount
   - Razorpay payment gateway opens
   - User completes payment

5. **Confirmation**
   - Success screen shows:
     - Credentials (UserID & Password for login)
     - Important info about refund policy
   - "View My Bookings on MyStays" button appears
   - Booking data saved to sessionStorage & localStorage

6. **MyStays Display**
   - User clicks button to view MyStays
   - Professional page loads with:
     - Header navigation
     - Purple hero section
     - Booking cards showing confirmed property
     - Footer with links and contact info
   - User can request refund or alternative property

7. **Logout**
   - User clicks red "Logout" button in header
   - All session data cleared
   - Redirected to home page

---

## 7. Data Structure

### Booking Confirmation Object
```javascript
{
    bookingId: "64f3e2c1a8b2c3d4e5f6g7h8",
    userId: "roomhyweb000123",
    propertyName: "Modern 2BHK Flat",
    propertyId: "prop_12345",
    ownerName: "John Doe",
    rentAmount: 25000,
    area: "South Mumbai",
    bookingDate: "2024-01-15T10:30:00.000Z",
    paymentId: "pay_1234567890ABCDEF",
    paymentStatus: "completed",
    status: "confirmed"
}
```

### Booking Card Fields (from API or localStorage)
```javascript
{
    property_name: "Modern 2BHK Flat",
    property_location: "South Mumbai",
    property_image: "https://...",
    check_in_date: "2024-01-20",
    check_out_date: "2024-02-20",
    total_amount: 25000,
    booking_status: "confirmed",
    _id: "64f3e2c1a8b2c3d4e5f6g7h8"
}
```

---

## 8. Styling Classes

### Header/Nav
- `.header-nav` - Sticky header with shadow
- `.nav-item` - Navigation links with hover effect
- `.nav-item.active` - Active link with purple bottom border

### Hero
- `.hero-section` - Purple gradient background, white text, 60px padding

### Cards
- `.property-card` - White card with shadow and hover animation
- `.image-container` - Image wrapper with fallback gradient
- `.status-badge` - Badge showing booking status
- `.status-active` - Green border (Confirmed)
- `.status-upcoming` - Yellow border (Upcoming)
- `.status-completed` - Gray border (Completed)

### Footer
- `.footer-section` - Dark gray background (#1f2937)
- `.footer-link` - Lighter gray text with white hover effect

---

## 9. Testing Checklist

- [ ] **Booking Form**
  - [ ] userId field appears and is read-only
  - [ ] userId pre-fills from URL parameter
  - [ ] Form submits with userId included

- [ ] **Payment**
  - [ ] Razorpay payment gateway works
  - [ ] Payment success triggers confirmation

- [ ] **Success Screen**
  - [ ] Credentials displayed correctly
  - [ ] "View My Bookings" button appears after 1 second
  - [ ] Button redirects to MyStays with userId

- [ ] **MyStays Page**
  - [ ] Header displays correctly with all nav links
  - [ ] Hero section shows with correct title
  - [ ] Booking card loads and displays all info
  - [ ] Status badge shows correctly
  - [ ] Dates format correctly
  - [ ] Amount displays in bold purple
  - [ ] Footer displays with all 4 columns
  - [ ] Footer links are clickable
  - [ ] Responsive on mobile (single column)
  - [ ] Responsive on tablet (2 columns)
  - [ ] Responsive on desktop (3 columns)

- [ ] **Logout**
  - [ ] Logout button is visible in header
  - [ ] Confirmation dialog appears
  - [ ] All data is cleared
  - [ ] Redirects to home page

- [ ] **Refund/Alternative Modal**
  - [ ] Modal opens from card buttons
  - [ ] Can select refund or alternative
  - [ ] Can submit refund request
  - [ ] Modal closes after submission

---

## 10. Browser LocalStorage Keys

| Key | Storage Type | Purpose | Lifespan |
|-----|--------------|---------|----------|
| `userId` | localStorage | Currently logged-in user ID | Until logout |
| `userId` | sessionStorage | Session user ID | Until session ends |
| `bookingConfirmation` | sessionStorage | Just-confirmed booking | Session only |
| `lastBooking` | localStorage | Last booked property | Until logout or cleared |
| `roomhy_user_session` | localStorage | User session data | Until logout |
| `roomhy_kyc_verification` | localStorage | User registration data | Persistent |

---

## 11. API Integration Points

### Endpoints Used

1. **POST `/api/bookings/confirm`**
   - Submits completed booking form
   - Stores booking in database
   - Called from `submitBookingForm()`

2. **GET `/api/bookings/user/{userId}`**
   - Fetches all bookings for a user
   - Called from `loadUserBookings()` as fallback
   - Returns array of booking objects

3. **POST `/api/booking/refund-request`**
   - Submits refund or alternative property request
   - Called from `submitRefundRequest()` in MyStays

---

## 12. CSS Classes Summary

```css
/* Header Navigation */
.header-nav { sticky positioning, shadow }
.nav-item { hover effects, active state }

/* Hero Section */
.hero-section { purple gradient, centered text }

/* Property Cards */
.property-card { white card, shadow, hover animation }
.image-container { image wrapper, fallback gradient }
.status-badge { position absolute, color-coded by status }
.status-active { green border }
.status-upcoming { yellow border }
.status-completed { gray border }

/* Footer */
.footer-section { dark background, light text }
.footer-link { hover effect, color transition }

/* Forms */
.form-input { bordered input, focus effects }
.form-label { bold, small size }
.btn-primary { indigo background, hover darker }
```

---

## 13. Troubleshooting

### Issue: userId not showing in form
**Solution:** Check that URL has `?userId=VALUE` parameter

### Issue: Booking not appearing on MyStays
**Solution:** Check browser console for errors, verify sessionStorage has `bookingConfirmation` key

### Issue: "No bookings yet" shows even after booking
**Solution:** 
1. Check sessionStorage for `bookingConfirmation`
2. Try refreshing page
3. Check API response if available
4. Verify userId matches across pages

### Issue: Logout not working
**Solution:** Check browser console for JavaScript errors, ensure all localStorage keys exist

### Issue: Mobile layout broken
**Solution:** Verify Tailwind CSS is loaded, check `hidden md:flex` breakpoints

---

## 14. Files Modified

1. **booking-form.html**
   - Added userId field (line 71-81)
   - Added `populateUserIdField()` function
   - Updated `displaySuccessScreen()` to save data and redirect
   - Updated `DOMContentLoaded` event

2. **website/mystays.html**
   - Added header with navigation
   - Added hero section with gradient
   - Updated footer with 4 columns
   - Added `logout()` function
   - Styling for professional appearance

---

## 15. Quick Reference

### To Book a Property:
1. Register on new_signups.html
2. View property
3. Click "Book Now" → Auto-redirected with userId
4. Fill form (userId pre-filled)
5. Pay via Razorpay
6. View on MyStays

### To View Bookings:
1. Visit `/website/mystays.html?userId=YOUR_USER_ID`
2. Bookings load automatically
3. View refund/alternative options

### To Logout:
1. Click "Logout" button in header
2. Confirm dialog
3. Redirected to home

---

## API Response Format (Expected)

### Booking Object Structure
```json
{
  "_id": "64f3e2c1a8b2c3d4e5f6g7h8",
  "user_id": "roomhyweb000123",
  "property_id": "prop_12345",
  "property_name": "Modern 2BHK Flat",
  "property_location": "South Mumbai",
  "property_image": "https://...",
  "owner_name": "John Doe",
  "rent_amount": 25000,
  "total_amount": 25000,
  "check_in_date": "2024-01-20T00:00:00Z",
  "check_out_date": "2024-02-20T00:00:00Z",
  "booking_status": "confirmed",
  "payment_id": "pay_1234567890ABCDEF",
  "payment_status": "completed",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

End of Integration Guide
