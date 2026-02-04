# 🔄 Owner Banking Details - Data Flow Diagram

## Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OWNER BANKING DETAILS SYSTEM                      │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌────────────────────┐
                              │   PROPERTY OWNER   │
                              │  (ownerprofile.html)│
                              └─────────┬──────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
            ┌───────▼────────┐               ┌──────────────▼──────────┐
            │  Form Fields   │               │  JavaScript Processing  │
            ├────────────────┤               ├─────────────────────────┤
            │ Bank Name      │               │ 1. Extract 4 fields     │
            │ Account Number │       ──────► │ 2. Validate (required)  │
            │ IFSC Code      │               │ 3. Format data          │
            │ Branch Name    │               │ 4. Prepare payload      │
            └────────────────┘               └──────────┬──────────────┘
                                                        │
                    ┌───────────────────────────────────┴────────────────────┐
                    │                                                         │
            ┌───────▼──────────────┐                      ┌──────────────────▼────┐
            │   localStorage       │                      │   MONGODB Backend     │
            │   (Backup)           │                      │   (Primary Storage)   │
            ├──────────────────────┤                      ├───────────────────────┤
            │ roomhy_owners_db:    │  PATCH /api/owners   │ Owner Document:       │
            │ {                    │◄─────────────────────┤ {                     │
            │   owner_123: {       │                      │   loginId: "owner..." │
            │     profile: {       │                      │   name: "Raj Kumar"  │
            │       bankName,      │  POST Response       │   phone: "9876..."   │
            │       accountNumber, │─────────────────────►│   email: "..."       │
            │       ifscCode,      │                      │   profile: {         │
            │       branchName     │                      │     bankName,        │
            │     }                │                      │     accountNumber,   │
            │   }                  │                      │     ifscCode,        │
            │ }                    │                      │     branchName       │
            └──────────┬───────────┘                      │   }                  │
                       │                                  │ }                    │
                       │                                  └────────┬────────────┘
                       │                                           │
                       └───────────────────────┬───────────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  User Session       │
                                    │  (In Memory)        │
                                    ├─────────────────────┤
                                    │ user: {             │
                                    │   bankName: "HDFC" │
                                    │   accountNumber     │
                                    │   ifscCode          │
                                    │   branchName        │
                                    │ }                   │
                                    └─────────────────────┘


════════════════════════════════════════════════════════════════════════════


                         SUPERADMIN RENT DASHBOARD
                        (rentcollection.html)

     ┌─────────────────────────────────────────────────────────────────┐
     │                   Page Load Event                               │
     └────────────────────┬────────────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┬──────────────────┐
           │              │              │                  │
   ┌───────▼────┐ ┌───────▼────┐ ┌──────▼────┐ ┌──────────▼────┐
   │ GET        │ │ GET        │ │ GET       │ │ GET           │
   │ /tenants   │ │ /rents     │ │ /owners   │ │ /api/owners   │
   │            │ │            │ │           │ │ (MongoDB)     │
   │ Returns:   │ │ Returns:   │ │ Returns:  │ │              │
   │ 50 Tenant  │ │ 50 Rent    │ │ 30 Owner  │ │ Owner Data   │
   │ Records    │ │ Records    │ │ Records   │ │ with:        │
   │            │ │            │ │           │ │ - bankName   │
   │ [          │ │ [          │ │ [         │ │ - accountNum │
   │ {          │ │ {          │ │ {         │ │ - ifscCode   │
   │   loginId  │ │   tenantId │ │   loginId │ │ - branchName │
   │   name     │ │   paidAmt  │ │   name    │ │              │
   │   property │ │   status   │ │   phone   │ │ ...          │
   │   ...      │ │   ...      │ │   profile │ │              │
   │ }          │ │ }          │ │ {         │ │              │
   │ ]          │ │ ]          │ │ bankName  │ │              │
   └────────────┘ └────────────┘ │ ...       │ │              │
                                  │ }         │ │              │
                                  │ ]         │ │              │
                                  └───────────┘ └──────────────┘
                          │              │              │
                          └──────────────┼──────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  mergeTenantsWithRents()
                              │                     │
                              │ Merge 3 Datasets:   │
                              │ - Tenant            │
                              │ - Rent              │
                              │ - Owner Banking     │
                              │                     │
                              │ Match by:           │
                              │ - tenant.loginId    │
                              │ - rent.tenantId     │
                              │ - owner.loginId     │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Single Merged      │
                              │  Tenant Record      │
                              │                     │
                              │ {                   │
                              │   ...tenant,        │
                              │   ...rentInfo,      │
                              │   ownerInfo: {      │
                              │     name: "Raj",   │
                              │     phone: "98..",│
                              │     profile: {     │
                              │       bankName,    │
                              │       accountNum,  │
                              │       ifscCode,    │
                              │       branchName   │
                              │     }              │
                              │   }                │
                              │ }                  │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  displayTable()     │
                              │                     │
                              │  Create 14 Columns:│
                              │  1. Tenant Name     │
                              │  2. Email           │
                              │  3. Phone           │
                              │  4. Property        │
                              │  5. Room            │
                              │  6. Rent Amount     │
                              │  7. Payment Status  │
                              │  8. Move In Date    │
                              │  9. Owner Name      │◄──┐
                              │ 10. Owner Phone     │  │
                              │ 11. Bank Name       │  │ NEW
                              │ 12. Account Number  │  │ COLUMNS
                              │ 13. IFSC Code       │  │
                              │ 14. Branch Name     │◄──┘
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Render HTML Table  │
                              │                     │
                              │  Display in        │
                              │  superadmin view    │
                              │                     │
                              │  Auto-refresh       │
                              │  every 30 seconds   │
                              └─────────────────────┘


════════════════════════════════════════════════════════════════════════════


                       SUPERADMIN OWNER LIST
                          (owner.html)

     ┌─────────────────────────────────────────────────────────────────┐
     │                   Page Load Event                               │
     └────────────────────┬────────────────────────────────────────────┘
                          │
                   ┌──────▼──────┐
                   │ GET         │
                   │ /api/owners │
                   │             │
                   │ Returns:    │
                   │ 30 Owners   │
                   │ [           │
                   │  {          │
                   │   loginId   │
                   │   name      │
                   │   email     │
                   │   phone     │
                   │   profile: {│
                   │    bankName │
                   │    accountN │
                   │    ifscCode │
                   │    branchNm │
                   │   }         │
                   │   kyc       │
                   │   ...       │
                   │  }          │
                   │ ]           │
                   └──────┬──────┘
                          │
                   ┌──────▼──────────────┐
                   │  Extract Data       │
                   │                     │
                   │  For each owner:    │
                   │  - id               │
                   │  - name             │
                   │  - email            │
                   │  - phone            │
                   │  - address          │
                   │  - password         │
                   │  - areaCode         │
                   │  - profile.bankName │◄──┐
                   │  - profile.accountNo│  │ NEW
                   │  - profile.ifscCode │  │ EXTRACTION
                   │  - profile.branchNm │◄──┘
                   │  - kycStatus        │
                   │  - documentImage    │
                   └──────┬──────────────┘
                          │
                   ┌──────▼──────────────┐
                   │  Create Table Row   │
                   │                     │
                   │  12 Columns:        │
                   │  1. Owner ID        │
                   │  2. Name & Contact  │
                   │  3. Address         │
                   │  4. Password        │
                   │  5. Area            │
                   │  6. Bank Name       │◄──┐
                   │  7. Account Number  │  │ NEW
                   │  8. IFSC Code       │  │ COLUMNS
                   │  9. Branch Name     │◄──┘
                   │ 10. KYC Status      │
                   │ 11. Docs            │
                   │ 12. Delete (Trash)  │
                   └──────┬──────────────┘
                          │
                   ┌──────▼──────────────┐
                   │ Render HTML Table   │
                   │                     │
                   │ + Search Function   │
                   │ + Filter Function   │
                   │ + Excel Export      │
                   │ + Delete Function   │
                   └─────────────────────┘


════════════════════════════════════════════════════════════════════════════


                        COMPLETE FIELD MAPPING

Owner Profile Form → MongoDB Storage → Display in Dashboards

┌────────────────────────────────────────────────────────────────────┐
│                    BANKING DETAILS FIELDS                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Field                  │  Form ID         │  MongoDB Path         │
│  ─────────────────────────────────────────────────────────────────│
│  Bank Name              │ bank-name        │ profile.bankName      │
│  Account Number         │ account-number   │ profile.accountNumber │
│  IFSC Code              │ ifsc-code        │ profile.ifscCode      │
│  Branch Name            │ branch-name      │ profile.branchName    │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

Display in:
  ✓ rentcollection.html columns 11, 12, 13, 14
  ✓ owner.html columns 6, 7, 8, 9
  ✓ Excel export (all 4 columns)


════════════════════════════════════════════════════════════════════════════


                        ERROR & FALLBACK HANDLING

┌─────────────────────────────────────────────────────────────────┐
│  Scenario                  │  Handling                          │
├────────────────────────────────────────────────────────────────┤
│ API returns no owner data  │ Show 'N/A' in all owner columns   │
│ Owner profile missing      │ Use empty object, show 'N/A'      │
│ Banking field null/empty   │ Display 'N/A' for that field      │
│ /api/owners endpoint fails │ Fall back to localStorage         │
│ Network timeout            │ Use cached data from localStorage │
│ localStorage corrupt       │ Initialize new empty profile      │
│ Missing required field     │ Form validation prevents submit   │
│ Database save fails        │ Fallback to localStorage only     │
└────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════


                          REAL-TIME UPDATES

On ownerprofile.html:
  Owner fills form → Save button → Send to MongoDB → Update session

On rentcollection.html:
  Auto-refresh every 30 seconds → Fetch latest owner data → Display updates

On owner.html:
  Manual search/filter → Fetch from current loaded data
  Can edit owner → Changes reflect in other dashboards


════════════════════════════════════════════════════════════════════════════
```

---

## 🔑 Key Connection Points

### ownerprofile.html → MongoDB
- **Endpoint**: `PATCH /api/owners/{loginId}`
- **Payload**: `{ profile: { bankName, accountNumber, ifscCode, branchName, ... } }`
- **Backup**: localStorage `roomhy_owners_db`

### rentcollection.html ← MongoDB
- **Endpoints**: 
  - `GET /api/tenants`
  - `GET /api/rents`
  - `GET /api/owners` ← **NEW**
- **Merge Key**: owner.loginId
- **Display**: 6 new owner-related columns

### owner.html ← MongoDB
- **Endpoint**: `GET /api/owners`
- **Extract**: `owner.profile.bankName`, `.accountNumber`, `.ifscCode`, `.branchName`
- **Display**: 4 separate banking columns

---

## 💾 Data Persistence Chain

```
User Input (ownerprofile.html)
    ↓
JavaScript Memory (allTenants array)
    ↓
MongoDB (Primary storage)
    ↓
localStorage (Backup fallback)
    ↓
sessionStorage (Session user object)
    ↓
API Response → rentcollection.html
    ↓
Display in HTML Table
```

---

## 🎯 Example: Owner "Raj Kumar"

```javascript
// In ownerprofile.html - Owner fills form
{
  bankName: "HDFC Bank",
  accountNumber: "1234567890123456",
  ifscCode: "HDFC0000001",
  branchName: "Bangalore Main Branch"
}

// Sent to MongoDB
POST /api/owners/raj_kumar
{
  profile: {
    bankName: "HDFC Bank",
    accountNumber: "1234567890123456",
    ifscCode: "HDFC0000001",
    branchName: "Bangalore Main Branch",
    updatedAt: "2024-02-04T10:30:00Z"
  }
}

// Stored in MongoDB
{
  _id: ObjectId(...),
  loginId: "raj_kumar",
  name: "Raj Kumar",
  email: "raj@example.com",
  phone: "9876543210",
  profile: {
    bankName: "HDFC Bank",
    accountNumber: "1234567890123456",
    ifscCode: "HDFC0000001",
    branchName: "Bangalore Main Branch",
    updatedAt: "2024-02-04T10:30:00Z"
  }
}

// Fetched in rentcollection.html
GET /api/owners → Returns above document

// Displayed in rent collection
John Doe | john@... | 98765... | XYZ Property | 201 | ₹15000 | Paid | Jan 15
| Raj Kumar | 9876543210 | HDFC Bank | 1234567890123456 | HDFC0000001 | Bangalore Main Branch |

// Also displayed in owner.html
raj_kumar | Raj Kumar | ... | HDFC Bank | 1234567890123456 | HDFC0000001 | Bangalore Main Branch | ...
```

---

**Last Updated**: February 4, 2026
