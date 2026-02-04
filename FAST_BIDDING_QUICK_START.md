# Fast Bidding Feature - Quick Start Guide

## How to Access the Feature

### 1. From Website Home (index.html)
- Look for **"⚡ Fast Bidding"** button in the top navigation bar
- On mobile, it appears in the menu dropdown
- Click to navigate to the fast bidding form

### 2. Direct URL
- Navigate directly to: `website/fast-bidding.html`

## Form Fields Explained

### Personal Information Section
| Field | Type | Required | Example |
|-------|------|----------|---------|
| Full Name | Text | Yes | John Doe |
| Gmail Address | Email | Yes | john@gmail.com |
| User ID (Phone) | Phone | Yes | 9876543210 |
| Gender | Dropdown | Yes | Female/Male/Other |

### Location & Search Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Select City | Dropdown | Yes | Fetched from locations API |
| Select Area | Dropdown | Yes | Populates after city selection |
| Min Price | Number | Yes | Minimum monthly rent (₹) |
| Max Price | Number | Yes | Maximum monthly rent (₹) |

## Step-by-Step Instructions

### Step 1: Enter Personal Details
```
✓ Enter your full name
✓ Enter your Gmail address (must be @gmail.com)
✓ Enter your 10-digit phone number
✓ Select your gender
```

### Step 2: Select Location
```
✓ Click "Select City" dropdown
✓ Choose your preferred city (Kota, Indore, Sikar, Pune, Delhi, etc.)
✓ Click "Select Area" dropdown (auto-populates after city selection)
✓ Choose your preferred area within the city
```

### Step 3: Set Price Range
```
✓ Enter minimum rent amount you're willing to pay
✓ Enter maximum rent amount you're willing to pay
✓ Price range will filter available properties
```

### Step 4: View & Select Properties
```
✓ Properties matching your criteria will appear below
✓ Each property shows:
  - Property number (e.g., PROP001)
  - Property name
  - Monthly rent
  - Gender accommodation type
  - Property type (PG/Hostel/Flat)
✓ Click checkbox to select properties you want to bid on
✓ You can select multiple properties
✓ Selected properties will be highlighted in blue
```

### Step 5: Submit Bids
```
✓ Click "Send Bids to All Matching Properties" button
✓ Form will validate all fields
✓ If validation passes, bids are submitted
✓ Success modal confirms bids sent
```

### Step 6: Confirmation
```
✓ Success modal shows:
  - Number of properties your bid was sent to
  - Confirmation message
  - Timeline for owner response (24 hours)
✓ Click "Done" to close and clear the form
```

## Validation Rules

### Name
- **Rule**: Cannot be empty
- **Error**: "Full name is required"

### Gmail
- **Rule**: Must be valid email with @gmail.com domain
- **Error**: "Valid Gmail address is required"

### Phone (User ID)
- **Rule**: Must be exactly 10 digits
- **Error**: "Valid 10-digit phone number required"

### Gender
- **Rule**: Must select a value
- **Options**: Male, Female, Other

### City
- **Rule**: Must select a value
- **Options**: Dynamically loaded from API

### Area
- **Rule**: Must select a value
- **Note**: Only available after city selection

### Price Range
- **Rule**: Both min and max required, min must be less than max
- **Note**: Will automatically filter properties

### Property Selection
- **Rule**: At least one property must be selected
- **Error**: "Please select at least one property to bid on"

## What Happens After Submission?

1. **Bid Stored**: Your bid details are stored in the system
2. **Owner Notification**: Property owners receive your bid request
3. **Owner Response**: Owners have up to 24 hours to respond
4. **Phone Share**: Your phone number is only shared if owner accepts
5. **Next Steps**: You'll be notified when owner responds

## Key Features

✨ **Real-time Validation**
- Form validates as you type
- Helpful error messages appear below fields

✨ **Dynamic Property Loading**
- Properties load automatically when you set filters
- Loading spinner shows while fetching

✨ **Multiple Selection**
- Select as many properties as you want
- Visual feedback for selected items

✨ **Fallback Support**
- Even if API is down, sample properties display
- Smooth user experience guaranteed

✨ **Responsive Design**
- Works perfectly on mobile and desktop
- Touch-friendly interface

## Mobile Tips

1. Use landscape mode for better form visibility
2. Properties list scrolls horizontally if needed
3. All buttons are touch-friendly
4. Form auto-scrolls to error messages

## Data Security

🔒 **Your Information**
- Email is used only for confirmation
- Phone is hidden from owners until they accept your bid
- Personal data is encrypted in transit

🔒 **Privacy**
- No sharing with third parties
- Secure payment processing
- Compliance with data protection laws

## Troubleshooting

### "No properties found"
- **Cause**: No properties match your filters
- **Solution**: 
  - Increase max price
  - Try different area
  - Check internet connection

### "Form validation failed"
- **Cause**: Missing or invalid information
- **Solution**:
  - Check all red error messages
  - Ensure phone has exactly 10 digits
  - Use @gmail.com email address

### "API Error"
- **Cause**: Backend connection issue
- **Solution**:
  - The form will use sample data
  - You can still submit bids
  - System will retry connection

### Properties not loading
- **Cause**: API delay or network issue
- **Solution**:
  - Wait for loading spinner to finish
  - Refresh the page
  - Check internet connection

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/locations/cities | GET | Fetch all cities |
| /api/locations/areas/city/:cityId | GET | Fetch areas by city |
| /api/website-properties/search | GET | Search properties |
| /api/bids/fast-bid | POST | Submit fast bid |

## Example Successful Flow

```
1. User: "John Doe" | john@gmail.com | 9876543210 | Female
2. Location: Kota, Rajasthan > East Kota
3. Price: ₹5000 - ₹8000
4. Properties Found: 5 properties
5. Selected: 3 properties (PROP001, PROP002, PROP003)
6. Result: "Bid sent to 3 properties successfully!"
```

## Next Steps

After fast bidding:
1. Monitor your notifications
2. Check "My Stays" section for bid status
3. Respond to owner messages within chat
4. Complete payment after owner accepts
5. Schedule property visits
6. Confirm booking

---

**Need Help?**
- Contact Support: support@roomhy.com
- FAQ: Visit [website/about.html](website/about.html)
- Chat: Click the green chat icon in bottom right
