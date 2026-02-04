# How to Populate Owner Data with All Columns Filled

## Problem
The owner.html page is showing mostly "-" values because:
1. Owner names are "Unknown" in the database
2. Visit data is not properly matched to owners
3. Banking details are missing

## Solution - Quick Setup

### Step 1: Open Browser DevTools
1. Open owner.html in your browser
2. Press **F12** to open DevTools
3. Click on the **Console** tab

### Step 2: Copy and Paste the Setup Commands
Copy the following code and paste it in the Console:

```javascript
// Set owners with complete profile data
localStorage.setItem('roomhy_owners_db', '{"ROOMHY2776":{"name":"Raj Kumar","email":"raj.kumar@example.com","phone":"9876543210","address":"123 Main Street, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Raj Kumar","bankName":"HDFC Bank","accountNumber":"1234567890123456","ifscCode":"HDFC0001234","branchName":"Bangalore Main"},"kycStatus":"Verified"},"ROOMHY6261":{"name":"Priya Singh","email":"priya.singh@example.com","phone":"9876543211","address":"456 Park Avenue, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Priya Singh","bankName":"ICICI Bank","accountNumber":"9876543210987654","ifscCode":"ICIC0000123","branchName":"Bangalore South"},"kycStatus":"Verified"},"ROOMHY1310":{"name":"Amit Patel","email":"amit.patel@example.com","phone":"9876543212","address":"789 Tech Park, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Amit Patel","bankName":"SBI Bank","accountNumber":"5678901234567890","ifscCode":"SBIN0001234","branchName":"Bangalore North"},"kycStatus":"Verified"},"ROOMHY6461":{"name":"Deepak Sharma","email":"deepak.sharma@example.com","phone":"9876543213","address":"321 Commercial Street, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Deepak Sharma","bankName":"Axis Bank","accountNumber":"1112223334445556","ifscCode":"AXISBANK123","branchName":"Bangalore East"},"kycStatus":"Pending"}}');
```

Press Enter.

### Step 3: Set Visit Data
Copy and paste this in the Console:

```javascript
// Set visit data with matching owner names and financial details
localStorage.setItem('roomhy_visits', '[{"propertyInfo":{"ownerName":"Raj Kumar","contactPhone":"9876543210","area":"KO","propertyType":"Apartment","bedrooms":2,"furnished":"Semi-Furnished"},"monthlyRent":15000,"deposit":30000,"amenities":["WiFi","AC","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Good property, verified details"},{"propertyInfo":{"ownerName":"Priya Singh","contactPhone":"9876543211","area":"KO","propertyType":"Apartment","bedrooms":3,"furnished":"Furnished"},"monthlyRent":20000,"deposit":40000,"amenities":["WiFi","AC","Gym","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Premium property"},{"propertyInfo":{"ownerName":"Amit Patel","contactPhone":"9876543212","area":"KO","propertyType":"Flat","bedrooms":1,"furnished":"Unfurnished"},"monthlyRent":12000,"deposit":25000,"amenities":["WiFi","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Affordable option"},{"propertyInfo":{"ownerName":"Deepak Sharma","contactPhone":"9876543213","area":"KO","propertyType":"Villa","bedrooms":4,"furnished":"Furnished"},"monthlyRent":25000,"deposit":50000,"amenities":["WiFi","AC","Garden","Parking","Security"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Luxury property"}]');
```

Press Enter.

### Step 4: Refresh the Page
Type in Console:
```javascript
location.reload();
```

Press Enter.

---

## What You'll See After Setup

### Owner Data (Fully Populated):

| Owner ID | Name | Phone | Address | Area | Bank Name | Account | IFSC | Branch | Monthly Rent | Deposit | KYC |
|----------|------|-------|---------|------|-----------|---------|------|--------|--------------|---------|-----|
| ROOMHY2776 | Raj Kumar | 9876543210 | 123 Main Street | KO | HDFC Bank | 1234567890123456 | HDFC0001234 | Bangalore Main | ₹15,000 | ₹30,000 | Verified |
| ROOMHY6261 | Priya Singh | 9876543211 | 456 Park Avenue | KO | ICICI Bank | 9876543210987654 | ICIC0000123 | Bangalore South | ₹20,000 | ₹40,000 | Verified |
| ROOMHY1310 | Amit Patel | 9876543212 | 789 Tech Park | KO | SBI Bank | 5678901234567890 | SBIN0001234 | Bangalore North | ₹12,000 | ₹25,000 | Verified |
| ROOMHY6461 | Deepak Sharma | 9876543213 | 321 Commercial St | KO | Axis Bank | 1112223334445556 | AXISBANK123 | Bangalore East | ₹25,000 | ₹50,000 | Pending |

---

## Verification Steps

### Check if data loaded correctly:
```javascript
// In Console, type:
JSON.parse(localStorage.getItem('roomhy_owners_db'));
// Should show 4 owners with full details

JSON.parse(localStorage.getItem('roomhy_visits'));
// Should show 4 visits with rent and deposit

// Or check console logs:
console.log('Owners:', Object.keys(JSON.parse(localStorage.getItem('roomhy_owners_db'))).length);
console.log('Visits:', JSON.parse(localStorage.getItem('roomhy_visits')).length);
```

---

## Data Structure

### Owner Object:
```javascript
{
  "ROOMHY2776": {
    "name": "Raj Kumar",
    "email": "raj.kumar@example.com",
    "phone": "9876543210",
    "address": "123 Main Street, Bangalore",
    "locationCode": "KO",
    "password": "password123",
    "profile": {
      "name": "Raj Kumar",
      "bankName": "HDFC Bank",
      "accountNumber": "1234567890123456",
      "ifscCode": "HDFC0001234",
      "branchName": "Bangalore Main"
    },
    "kycStatus": "Verified"
  }
}
```

### Visit Object:
```javascript
{
  "propertyInfo": {
    "ownerName": "Raj Kumar",        // ← MUST match owner name exactly
    "contactPhone": "9876543210",
    "area": "KO",
    "propertyType": "Apartment",
    "bedrooms": 2,
    "furnished": "Semi-Furnished"
  },
  "monthlyRent": 15000,              // ← Displays as ₹15,000
  "deposit": 30000,                  // ← Displays as ₹30,000
  "amenities": ["WiFi", "AC", "Parking"],
  "visitDate": "2026-02-04T08:25:00.000Z",
  "notes": "Good property, verified details"
}
```

---

## How the Data Flows

```
visit.html or API
    ↓
    (stores in localStorage['roomhy_visits'])
    ↓
owner.html JavaScript:
    ├─ 1. Load visits from localStorage
    ├─ 2. Create visitMap by owner name (case-insensitive)
    ├─ 3. For each owner, look up visitMap[ownerName]
    └─ 4. Display rent and deposit with ₹ symbol
```

---

## Common Issues

### Issue: "✅ Loaded visit data for 0 owners"
**Cause:** Owner names don't match between owner DB and visit data
**Solution:** Make sure `propertyInfo.ownerName` in visit data matches `owner.name` exactly (case-insensitive)

### Issue: Monthly Rent/Deposit showing "-"
**Cause:** Visit data didn't load or owner name mismatch
**Solution:** 
- Check console: `localStorage.getItem('roomhy_visits')`
- Verify owner names match
- Try refreshing the page

### Issue: All columns showing "-" except Owner ID
**Cause:** Owner data not in localStorage or API not working
**Solution:**
- Reload the setup commands
- Or connect backend to MongoDB to fetch owner data via `/api/owners`

---

## File References

**Test Data Script:** `populate_complete_data.js`
- Creates MongoDB records with proper owner data
- Generates localStorage commands

**Setup Commands:** `SETUP_OWNER_DATA.js`
- Copy-paste friendly version
- All data in one command

**Owner Dashboard:** `superadmin/owner.html`
- Displays owner information
- Shows banking details (Phase 1)
- Shows rent/deposit (Phase 2)

