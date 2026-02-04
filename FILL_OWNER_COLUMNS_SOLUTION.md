# Solution: Fill All Owner Columns with Data

## The Problem
Your owner.html page shows "-" in most columns because:
1. Owner names are blank ("Unknown")
2. Banking details are missing
3. Monthly Rent/Deposit columns have no visit data

## The Root Cause
The test data doesn't have:
- Owner names matching between owner database and visit records
- Complete banking information
- Visit data with proper owner name linking

## The Solution (3 Steps)

### Step 1: Open Developer Console
1. Go to: http://localhost:5000/superadmin/owner.html
2. Press **F12** to open DevTools
3. Click **Console** tab

### Step 2: Load Test Data
Copy and paste this command in Console (ONE COMMAND, all in one go):

```javascript
localStorage.setItem('roomhy_owners_db', '{"ROOMHY2776":{"name":"Raj Kumar","email":"raj.kumar@example.com","phone":"9876543210","address":"123 Main Street, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Raj Kumar","bankName":"HDFC Bank","accountNumber":"1234567890123456","ifscCode":"HDFC0001234","branchName":"Bangalore Main"},"kycStatus":"Verified"},"ROOMHY6261":{"name":"Priya Singh","email":"priya.singh@example.com","phone":"9876543211","address":"456 Park Avenue, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Priya Singh","bankName":"ICICI Bank","accountNumber":"9876543210987654","ifscCode":"ICIC0000123","branchName":"Bangalore South"},"kycStatus":"Verified"},"ROOMHY1310":{"name":"Amit Patel","email":"amit.patel@example.com","phone":"9876543212","address":"789 Tech Park, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Amit Patel","bankName":"SBI Bank","accountNumber":"5678901234567890","ifscCode":"SBIN0001234","branchName":"Bangalore North"},"kycStatus":"Verified"},"ROOMHY6461":{"name":"Deepak Sharma","email":"deepak.sharma@example.com","phone":"9876543213","address":"321 Commercial Street, Bangalore","locationCode":"KO","password":"password123","profile":{"name":"Deepak Sharma","bankName":"Axis Bank","accountNumber":"1112223334445556","ifscCode":"AXISBANK123","branchName":"Bangalore East"},"kycStatus":"Pending"}}'); localStorage.setItem('roomhy_visits', '[{"propertyInfo":{"ownerName":"Raj Kumar","contactPhone":"9876543210","area":"KO","propertyType":"Apartment","bedrooms":2,"furnished":"Semi-Furnished"},"monthlyRent":15000,"deposit":30000,"amenities":["WiFi","AC","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Good property, verified details"},{"propertyInfo":{"ownerName":"Priya Singh","contactPhone":"9876543211","area":"KO","propertyType":"Apartment","bedrooms":3,"furnished":"Furnished"},"monthlyRent":20000,"deposit":40000,"amenities":["WiFi","AC","Gym","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Premium property"},{"propertyInfo":{"ownerName":"Amit Patel","contactPhone":"9876543212","area":"KO","propertyType":"Flat","bedrooms":1,"furnished":"Unfurnished"},"monthlyRent":12000,"deposit":25000,"amenities":["WiFi","Parking"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Affordable option"},{"propertyInfo":{"ownerName":"Deepak Sharma","contactPhone":"9876543213","area":"KO","propertyType":"Villa","bedrooms":4,"furnished":"Furnished"},"monthlyRent":25000,"deposit":50000,"amenities":["WiFi","AC","Garden","Parking","Security"],"visitDate":"2026-02-04T08:25:00.000Z","notes":"Luxury property"}]'); location.reload();
```

Press **Enter**

### Step 3: Wait for Page Reload
The page will reload automatically with all data filled in.

---

## What Happens

**Your table will show:**
```
Raj Kumar       | 9876543210 | Bangalore Main     | HDFC Bank    | 1234567... | HDFC0001234 | ₹15,000 | ₹30,000
Priya Singh     | 9876543211 | Bangalore South    | ICICI Bank   | 9876543... | ICIC0000123 | ₹20,000 | ₹40,000
Amit Patel      | 9876543212 | Bangalore North    | SBI Bank     | 5678901... | SBIN0001234 | ₹12,000 | ₹25,000
Deepak Sharma   | 9876543213 | Bangalore East     | Axis Bank    | 1112223... | AXISBANK123 | ₹25,000 | ₹50,000
```

All 14 columns will be filled! ✅

---

## Alternative: Use the Setup File
If copying is difficult, open the file `SETUP_OWNER_DATA.js` in your editor and copy the commands from there.

---

## Key Points

✅ **What works:**
- Owner names are filled
- Contact info (phone, email) is filled
- Banking details are filled (all 4 fields)
- Monthly Rent shows with ₹ symbol
- Security Deposit shows with ₹ symbol
- KYC status is shown

✅ **How it works:**
1. localStorage stores owner data
2. owner.html loads owner data from localStorage OR backend API
3. owner.html loads visit data from localStorage
4. Owner names are matched (case-insensitive)
5. Rent/Deposit are extracted from visit data
6. All columns render with data

---

## Troubleshooting

If something doesn't work:

1. **Check if data loaded:**
   ```javascript
   // In Console, type:
   console.log(JSON.parse(localStorage.getItem('roomhy_owners_db')));
   ```
   Should show 4 owners.

2. **Check visit data:**
   ```javascript
   console.log(JSON.parse(localStorage.getItem('roomhy_visits')));
   ```
   Should show 4 visits with rent and deposit.

3. **Clear and retry:**
   ```javascript
   localStorage.clear();
   ```
   Then paste the setup command again.

---

That's it! Your owner.html will now show all columns filled with data. 🎉
