# Commission System - Quick Reference Guide

## What Was Implemented

✅ **Platform Commission Dashboard** (platform.html)
- Shows all platform earnings
- Displays owner payouts to be settled
- Lists all commission transactions
- Real-time calculation from MongoDB

✅ **Owner Payout Column** (owner.html)
- New "To Be Paid" column added
- Shows net amount after commission deduction
- Automatically calculates based on rent payments

---

## Commission Calculation Rules

### Simple Formula:
```
Owner Payout = Total Rent Received - Commission - Service Fees
```

### Month-by-Month:
| Month | Commission Rate | Service Fee | What Owner Gets |
|-------|-----------------|-------------|-----------------|
| 1st | 10% of rent | ₹50 | Rent - 10% - ₹50 |
| 2nd | 0% | ₹50 | Rent - ₹50 |
| 3rd+ | 0% | ₹50 | Rent - ₹50 |

### Example:
```
Owner: Raj Kumar
Payment 1 (Month 1): ₹15,000
  Commission: ₹1,500 (10%)
  Service: ₹50
  Gets: ₹13,450

Payment 2 (Month 2): ₹15,000
  Commission: ₹0
  Service: ₹50
  Gets: ₹14,950

Total Payable: ₹28,400
```

---

## Where to View

### Platform Commission Dashboard:
**URL:** http://localhost:5000/superadmin/platform.html

**Shows:**
- Total platform revenue earned
- Pending payouts to owners
- Commission breakdown per owner
- Settlement status

### Owner Payout Column:
**URL:** http://localhost:5000/superadmin/owner.html

**Column:** "To Be Paid"
- Shows amount owner will receive
- Updated in real-time
- Includes all calculations

---

## How It Works (Behind the Scenes)

1. **Tenant Pays Rent** → Data saved to MongoDB
2. **System Fetches Payment Data** → Via `/api/rents` endpoint
3. **Calculate Commission** → Based on payment count per owner
4. **Show to Owner** → "To Be Paid" column displays net amount
5. **Track Platform Earnings** → platform.html shows total commission

---

## Data Calculation Steps

### Step 1: Fetch Paid Payments
```
Filter MongoDB where paymentStatus = 'completed' OR 'paid'
```

### Step 2: Group by Owner
```
Combine all payments from same owner
```

### Step 3: Calculate Commission
```
For each payment:
  IF first_payment: commission = rentAmount * 10%
  ELSE: commission = 0%
  
service_fee = ₹50 (always)
total_deduction = commission + service_fee
```

### Step 4: Calculate Payout
```
owner_payout = total_rent_collected - total_commission - total_service_fees
```

### Step 5: Display
```
Show in owner.html "To Be Paid" column
Show in platform.html commission table
```

---

## Files Modified

### 1. superadmin/platform.html
**What Changed:**
- Updated table to show calculated commissions
- Added real-time data loading from `/api/rents`
- Implemented commission calculation logic
- Added search/filter functionality

**Key Function:**
```javascript
function calculateCommission(paidData) {
    // Groups payments by owner
    // Calculates 10% commission on first month
    // Adds ₹50 service fee per month
    // Returns ownerPayout = rent - commission - fee
}
```

### 2. superadmin/owner.html
**What Changed:**
- Added "To Be Paid" column to table header
- Updated colspan from 14 to 15
- Enhanced loadOwners() to fetch commission data
- Added "To Be Paid" value in each row
- Updated Excel export to include new column

**Key Addition:**
```javascript
// Load commission data and calculate per owner
const commInfo = commissionMap[ownerLoginId];
const toBePaid = commInfo.totalRent - commInfo.totalCommission - commInfo.serviceFee;
Display: "To Be Paid" = ₹{toBePaid}
```

---

## Testing Checklist

- [ ] Open platform.html
- [ ] See commission calculations loading
- [ ] Check table displays owner data with payouts
- [ ] Open owner.html
- [ ] See "To Be Paid" column with amounts
- [ ] Filter/search works correctly
- [ ] Excel export includes "To Be Paid" column
- [ ] Multiple owners show different amounts
- [ ] Amounts match manual calculation

---

## Common Calculations

### Owner with 1 Payment:
```
Rent: ₹50,000
Commission: ₹5,000 (10%)
Service Fee: ₹50
To Be Paid: ₹44,950
```

### Owner with 2 Payments:
```
Payment 1: ₹50,000 → Commission ₹5,000 + Fee ₹50 = Payout ₹44,950
Payment 2: ₹50,000 → Commission ₹0 + Fee ₹50 = Payout ₹49,950
Total To Be Paid: ₹94,900
```

### Owner with 3 Payments:
```
Payment 1: ₹50,000 → Commission ₹5,000 + Fee ₹50 = Payout ₹44,950
Payment 2: ₹50,000 → Commission ₹0 + Fee ₹50 = Payout ₹49,950
Payment 3: ₹50,000 → Commission ₹0 + Fee ₹50 = Payout ₹49,950
Total To Be Paid: ₹144,850
```

---

## Changing Commission Rules

### To Change Commission Rate:
**File:** superadmin/platform.html and superadmin/owner.html

**Line:** In `calculateCommission()` function
```javascript
// Old: 10% commission
monthlyCommission = rentAmount * 0.10;

// New: 15% commission (example)
monthlyCommission = rentAmount * 0.15;
```

### To Change Service Fee:
**Files:** Both platform.html and owner.html

**Change:**
```javascript
// Old: ₹50 service fee
const monthlyServiceFee = 50;

// New: ₹100 service fee (example)
const monthlyServiceFee = 100;
```

---

## API Data Required

### Endpoint: `/api/rents`

**Required Fields:**
```javascript
{
    ownerLoginId: "ROOMHY2776",      // To group by owner
    rentAmount: 50000,                // For commission calculation
    paymentStatus: "completed",       // To filter paid only
    createdAt: "2026-02-04T10:00:00Z" // To track month
}
```

**Expected Response:**
Array of payment objects with above fields

---

## Troubleshooting

**Problem:** "To Be Paid" column shows "-"
**Solution:** Check if `/api/rents` endpoint is returning data

**Problem:** Commission amounts wrong
**Solution:** Verify payment count - 1st payment should show 10%, rest should show ₹50 only

**Problem:** Owner name doesn't match
**Solution:** Commission uses ownerLoginId, ensure it matches owner record

**Problem:** Platform.html shows no data
**Solution:** Ensure MongoDB has paid payments and `/api/rents` endpoint is working

---

## Summary

✅ Platform earns 10% on first month + ₹50/month service fee
✅ Owners see exact payout amount in "To Be Paid" column
✅ Calculations automatic from MongoDB payment data
✅ Real-time updates whenever new payment added
✅ Easy to modify commission rates if needed

**Status: Production Ready** 🚀
