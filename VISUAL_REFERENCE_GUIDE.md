# Visual Reference & Architecture Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROOMHY BOOKING SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   PROPERTY BROWSING      │
│   (index.html)           │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────────────────────────────────┐
│            BOOKING FORM (booking-form.html)          │
├──────────────────────────────────────────────────────┤
│  1. userId field [AUTO-FILLED] ← From URL param     │
│  2. Personal Information (name, phone, email)        │
│  3. Address Information (street, city, state, etc)   │
│  4. Document Upload (address proof)                  │
│  5. Payment Details (Razorpay integration)           │
│                                                      │
│  On Success:                                         │
│  - Save to sessionStorage: bookingConfirmation       │
│  - Save to localStorage: lastBooking                 │
│  - Show "View MyStays" button                        │
└──────────────────┬───────────────────────────────────┘
                   │
                   ↓
          ┌────────────────────┐
          │   RAZORPAY PAYMENT │
          │     Processing      │
          └────────┬───────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│        MYSTAYS PAGE (website/mystays.html)           │
├──────────────────────────────────────────────────────┤
│                     HEADER                            │
│  [Logo] RoomHy  Home  Properties  My Stays  Contact │
│                                    ↑Active       [Logout]
│                                                      │
│           ┌─────────────────────────────────────┐   │
│           │    HERO SECTION (Purple Gradient)    │   │
│           │  My Stays & Bookings                │   │
│           │  View and manage your bookings      │   │
│           └─────────────────────────────────────┘   │
│                                                      │
│    ┌──────────────────┬──────────────────────┐     │
│    │  BOOKING CARD 1  │   BOOKING CARD 2     │     │
│    │ [Image][Badge]   │  [Image][Badge]      │     │
│    │ Property Name    │  Property Name       │     │
│    │ Location         │  Location            │     │
│    │ Check-in: X      │  Check-in: X         │     │
│    │ Check-out: Y     │  Check-out: Y        │     │
│    │ Amount: ₹XXX     │  Amount: ₹XXX        │     │
│    │ [Refund][Alt]    │  [Refund][Alt]       │     │
│    └──────────────────┴──────────────────────┘     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ FOOTER (Dark Background)                     │   │
│  │                                               │   │
│  │ About RoomHy │ Links │ Support │ Contact Info│   │
│  │ Description  │ Home  │ Help    │ Email      │   │
│  │              │ Props │ FAQ     │ Phone      │   │
│  │              │ Stays │ Report  │ Address    │   │
│  │              │ Contact                       │   │
│  │                                               │   │
│  │ Privacy Policy | Terms | Cookie Policy        │   │
│  │ © 2024 RoomHy. All rights reserved.         │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING DATA FLOW                         │
└─────────────────────────────────────────────────────────────┘

BOOKING FORM → PAYMENT → SUCCESS → DATA PERSISTENCE → MYSTAYS
    ↓            ↓          ↓            ↓              ↓
    
┌─User Fills────────────────────────────────────────────────┐
│  - userId [AUTO-FILLED FROM URL]                          │
│  - Full Name, Phone, Email                                │
│  - Guardian Info                                          │
│  - Address Details                                        │
│  - Documents Upload                                       │
└─────────────────────────────┬──────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Payment Processing  │
                    │ (Razorpay)          │
                    │                     │
                    │ User pays rent fee  │
                    │ or booking amount   │
                    └────────┬────────────┘
                             ↓
                  ┌──────────────────────────┐
                  │ Payment Success Handler  │
                  │                          │
                  │ paymentId captured       │
                  │ Booking form submitted   │
                  │ Success screen shown     │
                  └────────┬─────────────────┘
                           ↓
        ┌──────────────────────────────────────────────┐
        │     DATA SAVED TO 3 LOCATIONS                │
        ├──────────────────────────────────────────────┤
        │                                              │
        │ SessionStorage:                              │
        │ └─ bookingConfirmation                       │
        │    {bookingId, userId, propertyName,        │
        │     ownerName, rentAmount, ...}             │
        │    (Until browser closed)                    │
        │                                              │
        │ LocalStorage:                                │
        │ └─ lastBooking                               │
        │    Same structure as sessionStorage          │
        │    (Persistent across sessions)              │
        │                                              │
        │ Database (API):                              │
        │ └─ POST /api/bookings/confirm                │
        │    Complete booking record stored            │
        │    (Permanent)                               │
        │                                              │
        └────────────┬─────────────────────────────────┘
                     ↓
        ┌──────────────────────────────────┐
        │  Success Screen Shows:           │
        │  - Credentials (UserId/Password) │
        │  - Booking confirmation message  │
        │  - After 1 second:               │
        │    Button: "View My Bookings"    │
        └────────────┬──────────────────────┘
                     ↓ (User Clicks)
        ┌──────────────────────────────────┐
        │ Redirect to MyStays              │
        │ URL: /website/mystays.html       │
        │     ?userId=BOOKING_USER_ID      │
        └────────────┬──────────────────────┘
                     ↓
    ┌────────────────────────────────────┐
    │  MyStays Loads Bookings            │
    │  Priority Order:                   │
    │                                    │
    │  1. Check sessionStorage           │
    │     └─ If bookingConfirmation      │
    │        found → Display immediately │
    │                                    │
    │  2. Check localStorage             │
    │     └─ If lastBooking found        │
    │        → Display                   │
    │                                    │
    │  3. Fetch from API                 │
    │     └─ GET /api/bookings/user/{id} │
    │        → Display all bookings      │
    │                                    │
    └────────────┬─────────────────────────┘
                 ↓
    ┌─────────────────────────────────┐
    │   Display Booking Cards         │
    │                                 │
    │   Grid Layout (Responsive):     │
    │   - Mobile: 1 column            │
    │   - Tablet: 2 columns           │
    │   - Desktop: 3 columns          │
    │                                 │
    │   Each Card Shows:              │
    │   - Property image              │
    │   - Status badge (color-coded)  │
    │   - Property name & location    │
    │   - Dates (check-in/out)        │
    │   - Amount (bold purple)        │
    │   - Booking ID                  │
    │   - Action buttons              │
    │     (Refund, Alternative)       │
    │                                 │
    └─────────────────────────────────┘
```

---

## 🎨 Page Layout Wireframes

### Booking Form Layout
```
┌─────────────────────────────────────────┐
│   [Logo] RoomHy                         │
│   Complete Your Booking                 │
│   Finalize booking with payment         │
├─────────────────────────────────────────┤
│                                         │
│  PROPERTY DETAILS                       │
│  ┌─────────────┬───────────────────┐   │
│  │ Property:   │ Owner:            │   │
│  │ [Filled]    │ [Filled]          │   │
│  └─────────────┴───────────────────┘   │
│                                         │
│  ⚠ Refund Policy Warning               │
│                                         │
│  PERSONAL INFORMATION                   │
│  ┌─────────────────────────────────┐   │
│  │ User ID (Auto-filled) *         │   │
│  │ [READONLY: user123]             │   │
│  │ Full Name *                     │   │
│  │ [Input: type name]              │   │
│  │ Phone Number *                  │   │
│  │ [Input: 10 digits]              │   │
│  │ Email Address *                 │   │
│  │ [Input: email]                  │   │
│  │ Guardian Name *                 │   │
│  │ [Input: parent name]            │   │
│  │ Guardian Phone *                │   │
│  │ [Input: 10 digits]              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ADDRESS INFORMATION                    │
│  ┌─────────────────────────────────┐   │
│  │ Street Address * [Input]        │   │
│  │ City * [Input]      State [In]  │   │
│  │ Postal Code * [In]  Country [In]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  DOCUMENTS                              │
│  ┌─────────────────────────────────┐   │
│  │ Drag files here or click        │   │
│  │ Accepted: JPG, PNG, PDF         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  PAYMENT & CONFIRMATION                 │
│  ┌─────────────────────────────────┐   │
│  │ [Pay Now Button] [Cancel Button]│   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### MyStays Layout (Desktop)
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] RoomHy   Home  Properties  My Stays  Contact  [Logout]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│      My Stays & Bookings                                   │
│      View and manage your property bookings with ease      │
│                                                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   [Image]    │  │   [Image]    │  │   [Image]    │    │
│  │  [✓Confirm]  │  │  [✓Confirm]  │  │  [✓Confirm]  │    │
│  │ Modern 2BHK  │  │ Cozy Studio  │  │Modern 1BHK   │    │
│  │ South Mumbai │  │ North Mumbai │  │ East Mumbai  │    │
│  │              │  │              │  │              │    │
│  │ In: Jan 20   │  │ In: Feb 01   │  │ In: Mar 15   │    │
│  │ Out: Feb 20  │  │ Out: Feb 28  │  │ Out: Apr 15  │    │
│  │ ₹25,000      │  │ ₹15,000      │  │ ₹20,000      │    │
│  │ ID: 64f3e2c1 │  │ ID: 64f3e2c2 │  │ ID: 64f3e2c3 │    │
│  │ [↩][⟳]      │  │ [↩][⟳]      │  │ [↩][⟳]      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  FOOTER (Dark)                                              │
│  About RoomHy | Quick Links | Support | Contact Info       │
│  Privacy Policy | Terms | Cookie Policy                    │
│  © 2024 RoomHy. All rights reserved.                       │
└────────────────────────────────────────────────────────────┘
```

### MyStays Layout (Mobile)
```
┌──────────────────────────────┐
│ [☰] RoomHy         [Logout]  │
├──────────────────────────────┤
│                              │
│   My Stays & Bookings        │
│   Manage your bookings       │
│                              │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │      [Image]           │  │
│  │    [✓ Confirmed]       │  │
│  │  Modern 2BHK Flat      │  │
│  │  📍 South Mumbai       │  │
│  │  In: Jan 20  Out: Feb20│  │
│  │  ₹25,000               │  │
│  │  ID: 64f3e2c1         │  │
│  │  [↩ Refund] [⟳ Alt]   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │      [Image]           │  │
│  │    [✓ Confirmed]       │  │
│  │  Cozy Studio           │  │
│  │  📍 North Mumbai       │  │
│  │  In: Feb 01  Out: Feb28│  │
│  │  ₹15,000               │  │
│  │  ID: 64f3e2c2         │  │
│  │  [↩ Refund] [⟳ Alt]   │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│  Footer (Stacked)            │
│  About, Links, Support       │
│  Contact, Privacy, Terms     │
│  © 2024 RoomHy              │
└──────────────────────────────┘
```

---

## 🎯 User Journey Map

```
START
  │
  ├─→ Register/Login (new_signups.html)
  │   └─→ Get userId: "roomhyweb000123"
  │
  ├─→ Browse Properties (index.html)
  │   └─→ Find suitable property
  │
  ├─→ Click "Book Now"
  │   └─→ Redirected with ?userId=roomhyweb000123
  │
  ├─→ Booking Form (booking-form.html)
  │   ├─→ userId field shows: roomhyweb000123 [READONLY]
  │   ├─→ Fill personal info (name, phone, email)
  │   ├─→ Fill guardian info
  │   ├─→ Fill address
  │   └─→ Upload documents
  │
  ├─→ Payment Page (Razorpay)
  │   ├─→ Review amount
  │   ├─→ Enter payment details
  │   └─→ Complete payment
  │
  ├─→ Success Screen
  │   ├─→ Show credentials (userId/password)
  │   ├─→ Display booking confirmation message
  │   ├─→ Save booking to sessionStorage & localStorage
  │   └─→ After 1 sec: "View My Bookings" button appears
  │
  ├─→ Click "View My Bookings"
  │   └─→ Redirect to /website/mystays.html?userId=roomhyweb000123
  │
  ├─→ MyStays Page Loads
  │   ├─→ Load from sessionStorage (FAST)
  │   ├─→ Display header with navigation
  │   ├─→ Display hero section
  │   ├─→ Display booking card(s)
  │   └─→ Display professional footer
  │
  ├─→ View Booking Details
  │   ├─→ See property image
  │   ├─→ See status badge (✓ Confirmed)
  │   ├─→ See property name & location
  │   ├─→ See dates (check-in/check-out)
  │   ├─→ See amount (₹25,000)
  │   ├─→ See booking ID
  │   └─→ Available actions: Refund, Alternative Property
  │
  ├─→ Option 1: Request Refund
  │   ├─→ Click "↩ Refund" button
  │   ├─→ Modal opens with options
  │   ├─→ Choose refund method (UPI/Bank/Other)
  │   ├─→ Submit refund request
  │   └─→ Confirmation message shows
  │
  ├─→ Option 2: Find Alternative
  │   ├─→ Click "⟳ Alternative" button
  │   ├─→ Modal opens with property preferences
  │   ├─→ Browse other properties
  │   ├─→ Select preferred area/amenities
  │   └─→ Submit request
  │
  ├─→ Option 3: Logout
  │   ├─→ Click red "Logout" button (header)
  │   ├─→ Confirmation dialog appears
  │   ├─→ Confirm logout
  │   ├─→ All data cleared (localStorage, sessionStorage)
  │   └─→ Redirected to home page
  │
  END
```

---

## 💾 Storage Structure

```
BROWSER STORAGE HIERARCHY
└─ SessionStorage (Dies when browser tab closed)
   ├─ bookingConfirmation
   │  └─ {
   │      bookingId: "64f3e2c1a8b2c3d4e5f6g7h8",
   │      userId: "roomhyweb000123",
   │      propertyName: "Modern 2BHK Flat",
   │      propertyId: "prop_12345",
   │      ownerName: "John Doe",
   │      rentAmount: 25000,
   │      area: "South Mumbai",
   │      bookingDate: "2024-01-15T10:30:00Z",
   │      paymentId: "pay_1234567890ABCDEF",
   │      paymentStatus: "completed",
   │      status: "confirmed"
   │     }
   │
   └─ userId
      └─ "roomhyweb000123"

└─ LocalStorage (Persists across sessions)
   ├─ userId
   │  └─ "roomhyweb000123"
   │
   ├─ lastBooking
   │  └─ { same structure as bookingConfirmation }
   │
   ├─ roomhy_user_session
   │  └─ { user session data }
   │
   └─ userIdCounter
      └─ "123"

└─ Database (MongoDB/API)
   └─ booking_confirmations collection
      └─ {
          _id: ObjectId,
          user_id: "roomhyweb000123",
          property_id: "prop_12345",
          property_name: "Modern 2BHK Flat",
          owner_id: "owner_456",
          owner_name: "John Doe",
          rent_amount: 25000,
          total_amount: 25000,
          check_in_date: Date,
          check_out_date: Date,
          payment_id: "pay_1234567890ABCDEF",
          payment_status: "completed",
          booking_status: "confirmed",
          created_at: Date,
          updated_at: Date
         }
```

---

## 🔄 Data Loading Priority

```
MyStays Page Loads → getUserId()
                   │
                   ↓
         loadUserBookings(userId)
         │
         ├─→ Try SessionStorage (FASTEST)
         │   │
         │   ├─→ Get bookingConfirmation
         │   ├─→ If found → Parse & use
         │   └─→ If NOT found → Continue to step 2
         │
         ├─→ Try LocalStorage (FAST)
         │   │
         │   ├─→ Get lastBooking
         │   ├─→ If found → Parse & use
         │   └─→ If NOT found → Continue to step 3
         │
         └─→ Try API (SLOWER but Complete)
             │
             ├─→ GET /api/bookings/user/{userId}
             ├─→ If success → Get all bookings
             ├─→ If error → Show empty state
             └─→ Always display bookings at this point
             
         displayBookings()
         │
         ├─→ Check if bookings exist
         ├─→ If YES → Render cards
         └─→ If NO → Show "No bookings yet"
```

---

## 🎨 Color Palette

```
PRIMARY COLORS
┌─────────────────────────────────┐
│ Indigo/Purple                   │
│ #4f46e5 (Primary Button)        │
│ #667eea (Gradient Start)        │
│ #764ba2 (Gradient End)          │
└─────────────────────────────────┘

STATUS COLORS
┌─────────────────────────────────┐
│ Green  #10b981 (Confirmed/OK)   │
│ Yellow #f59e0b (Upcoming)       │
│ Gray   #6b7280 (Completed)      │
│ Red    #dc2626 (Danger/Logout)  │
└─────────────────────────────────┘

BACKGROUND COLORS
┌─────────────────────────────────┐
│ White      #ffffff              │
│ Gray-50    #f9fafb (Page BG)    │
│ Gray-100   #f3f4f6 (Disabled)   │
│ Dark Gray  #1f2937 (Footer)     │
│ Black      #000000 (Overlay)    │
└─────────────────────────────────┘

TEXT COLORS
┌─────────────────────────────────┐
│ Black     #000000                │
│ Dark Gray #1f2937 (Primary)     │
│ Gray      #6b7280 (Secondary)   │
│ Light Gray #9ca3af (Tertiary)   │
│ White     #ffffff (On dark)     │
└─────────────────────────────────┘
```

---

## 📱 Responsive Breakpoints

```
Mobile First Design
├─ XS: 0-320px (Extra Small Phones)
│  └─ 1 column layout
│  └─ Hamburger menu
│  └─ Stacked footer
│
├─ SM: 321-640px (Small Phones)
│  └─ 1 column layout
│  └─ Hamburger menu
│  └─ Stacked footer
│
├─ MD: 641-1024px (Tablets)
│  └─ 2 column layout
│  └─ Visible nav (hidden on smaller)
│  └─ 2 column footer
│
└─ LG: 1025px+ (Desktop)
   └─ 3 column layout
   └─ Full horizontal nav
   └─ 4 column footer
```

---

## ⚡ Performance Metrics

```
Page Load Time
├─ SessionStorage Load: < 100ms (instant)
├─ LocalStorage Load: 100-200ms (instant)
└─ API Load: 1000-2000ms (if needed)

Render Time
├─ Header: < 50ms
├─ Hero: < 50ms
├─ Cards: 100-500ms (depends on # of bookings)
└─ Footer: < 50ms

Total Page Load Goal: < 2 seconds (with sessionStorage)

Memory Usage
├─ SessionStorage: ~5KB per booking
├─ LocalStorage: ~5KB per booking
└─ Typical: < 50KB total for user

Network Requests
├─ Without API: 0 requests (use cache)
└─ With API: 1 GET /api/bookings/user/{userId}
```

---

## 🧪 Test Matrix

```
BROWSERS TO TEST
├─ Chrome (Desktop)
├─ Firefox (Desktop)
├─ Safari (Desktop)
├─ Edge (Desktop)
├─ Chrome Mobile (Android)
└─ Safari Mobile (iOS)

DEVICES TO TEST
├─ iPhone 12 (390px)
├─ iPhone SE (375px)
├─ iPad (768px)
├─ iPad Pro (1024px)
├─ Desktop 1366x768
├─ Desktop 1920x1080
└─ Desktop 4K (2560x1440)

SCREEN SIZES TO TEST
├─ 320px (Min mobile)
├─ 375px (iPhone)
├─ 414px (iPhone Plus)
├─ 640px (Small tablets)
├─ 768px (iPad)
├─ 1024px (iPad Pro)
├─ 1280px (Laptops)
└─ 1920px (Desktop)
```

---

## 📊 Feature Comparison

```
BEFORE IMPLEMENTATION
┌─────────────────────────────────────┐
│ Booking Form                        │
├─────────────────────────────────────┤
│ ✗ User had to type userId manually  │
│ ✗ No confirmation of which user     │
│ ✗ Prone to typos                    │
│ ✗ No redirect after booking         │
│ ✗ No clear booking display          │
│ ✗ MyStays had basic layout          │
│ ✗ No header/nav                     │
│ ✗ No hero section                   │
│ ✗ No professional footer            │
└─────────────────────────────────────┘

AFTER IMPLEMENTATION
┌─────────────────────────────────────┐
│ Booking Form Enhanced               │
├─────────────────────────────────────┤
│ ✓ userId auto-filled from URL       │
│ ✓ Read-only field prevents changes  │
│ ✓ Clear visual indication           │
│ ✓ Auto-redirect to MyStays          │
│ ✓ Booking displays immediately      │
│ ✓ MyStays completely redesigned     │
│ ✓ Professional header navigation    │
│ ✓ Beautiful hero section            │
│ ✓ 4-column professional footer      │
│ ✓ Responsive on all devices         │
│ ✓ Data persists across sessions     │
│ ✓ 3-tier loading for performance    │
└─────────────────────────────────────┘
```

---

This visual reference guide complements the technical documentation and helps understand the overall architecture, data flow, and user experience design.
