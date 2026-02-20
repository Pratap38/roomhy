# Area Managers API - Quick Reference

## API Base URL
```
http://localhost:5000/api/area-managers
```

## 1. CREATE AREA MANAGER

### Request
```
POST /api/area-managers
Content-Type: application/json

{
    "name": "Yasmine Fatima",
    "loginId": "MGR001",
    "email": "yasminefathima0401@gmail.com",
    "password": "Manager@123",
    "phone": "9876543210",
    "area": "Downtown",
    "areaName": "Downtown Zone",
    "areaCode": "DT001",
    "city": "Mumbai",
    "region": "Maharashtra",
    "permissions": ["view_properties", "approve_bookings", "manage_tenants"]
}
```

### Response
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Yasmine Fatima",
        "loginId": "MGR001",
        "email": "yasminefathima0401@gmail.com",
        "area": "Downtown",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
    },
    "message": "Area manager created successfully"
}
```

---

## 2. GET ALL MANAGERS

### Request
```
GET /api/area-managers
```

### Response
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Yasmine Fatima",
            "email": "yasminefathima0401@gmail.com",
            "area": "Downtown",
            "phone": "9876543210",
            "isActive": true
        },
        {
            "_id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "john@test.com",
            "area": "Uptown",
            "phone": "9123456789",
            "isActive": true
        }
    ]
}
```

---

## 3. GET MANAGER BY EMAIL

### Request
```
GET /api/area-managers/email/yasminefathima0401@gmail.com
```

### Response
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Yasmine Fatima",
        "email": "yasminefathima0401@gmail.com",
        "area": "Downtown",
        "phone": "9876543210",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
    }
}
```

---

## 4. GET MANAGERS BY AREA

### Request
```
GET /api/area-managers/area/Downtown
```

### Response
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Yasmine Fatima",
            "area": "Downtown",
            "email": "yasminefathima0401@gmail.com"
        }
    ]
}
```

---

## 5. SEARCH MANAGERS

### Request
```
GET /api/area-managers/search?query=yasmine
```

### Response
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Yasmine Fatima",
            "email": "yasminefathima0401@gmail.com",
            "loginId": "MGR001"
        }
    ]
}
```

---

## 6. GET MANAGER BY ID

### Request
```
GET /api/area-managers/507f1f77bcf86cd799439011
```

### Response
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Yasmine Fatima",
        "email": "yasminefathima0401@gmail.com",
        "area": "Downtown",
        "phone": "9876543210",
        "createdAt": "2024-01-15T10:30:00Z"
    }
}
```

---

## 7. UPDATE MANAGER

### Request
```
PUT /api/area-managers/507f1f77bcf86cd799439011
Content-Type: application/json

{
    "phone": "9999999999",
    "area": "Uptown",
    "permissions": ["view_properties", "approve_bookings", "manage_tenants", "view_reports"]
}
```

### Response
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Yasmine Fatima",
        "email": "yasminefathima0401@gmail.com",
        "phone": "9999999999",
        "area": "Uptown",
        "updatedAt": "2024-01-15T11:00:00Z"
    },
    "message": "Area manager updated successfully"
}
```

---

## 8. UPDATE PASSWORD

### Request
```
PATCH /api/area-managers/507f1f77bcf86cd799439011/password
Content-Type: application/json

{
    "currentPassword": "Manager@123",
    "newPassword": "NewPass@456"
}
```

### Response
```json
{
    "success": true,
    "message": "Password updated successfully"
}
```

---

## 9. DELETE MANAGER (Soft Delete)

### Request
```
DELETE /api/area-managers/507f1f77bcf86cd799439011
```

### Response
```json
{
    "success": true,
    "message": "Area manager deleted successfully"
}
```

---

## 10. BULK IMPORT

### Request
```
POST /api/area-managers/bulk/import
Content-Type: application/json

{
    "managers": [
        {
            "name": "Manager 1",
            "loginId": "MGR001",
            "email": "mgr1@test.com",
            "password": "Pass@123",
            "phone": "9000000001",
            "area": "Downtown",
            "areaCode": "DT001"
        },
        {
            "name": "Manager 2",
            "loginId": "MGR002",
            "email": "mgr2@test.com",
            "password": "Pass@123",
            "phone": "9000000002",
            "area": "Uptown",
            "areaCode": "UP001"
        }
    ]
}
```

### Response
```json
{
    "success": true,
    "data": {
        "imported": 2,
        "skipped": 0,
        "failed": 0,
        "results": [
            { "email": "mgr1@test.com", "status": "imported" },
            { "email": "mgr2@test.com", "status": "imported" }
        ]
    },
    "message": "Bulk import completed"
}
```

---

## Testing with cURL

### 1. Create a Test Manager
```bash
curl -X POST http://localhost:5000/api/area-managers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Manager",
    "loginId": "TEST001",
    "email": "test.manager@example.com",
    "password": "TestPass@123",
    "phone": "9876543210",
    "area": "Downtown",
    "areaCode": "DT001"
  }'
```

### 2. Get All Managers
```bash
curl http://localhost:5000/api/area-managers
```

### 3. Search Manager
```bash
curl "http://localhost:5000/api/area-managers/search?query=test"
```

### 4. Get by Email
```bash
curl http://localhost:5000/api/area-managers/email/test.manager@example.com
```

### 5. Update Manager
```bash
curl -X PUT http://localhost:5000/api/area-managers/{ID} \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999"}'
```

### 6. Update Password
```bash
curl -X PATCH http://localhost:5000/api/area-managers/{ID}/password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass@123",
    "newPassword": "NewPass@456"
  }'
```

### 7. Delete Manager
```bash
curl -X DELETE http://localhost:5000/api/area-managers/{ID}
```

---

## Testing Forgot Password with MongoDB Manager

### 1. Create Test Manager (as shown above)

### 2. Request OTP
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.manager@example.com"
  }'
```

### 3. Verify OTP (you'll see in console or email)
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.manager@example.com",
    "otp": "123456"
  }'
```

### 4. Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.manager@example.com",
    "otp": "123456",
    "newPassword": "FinalPass@789"
  }'
```

---

## Common Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Server error |

---

## Database Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique MongoDB identifier |
| name | String | Full name of manager |
| loginId | String | Unique login identifier (e.g., MGR001) |
| email | String | Email address (unique, used for login) |
| password | String | Encrypted password (never sent in response) |
| phone | String | Contact phone number |
| area | String | Area name they manage |
| areaCode | String | Area code (e.g., DT001) |
| areaName | String | Display name for area |
| city | String | City name |
| region | String | Region name |
| permissions | [String] | Array of permission strings |
| isActive | Boolean | Active/Inactive status |
| role | String | Role (default: 'areamanager') |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

---

## Notes

- All passwords are automatically hashed before storage
- Email lookups are case-insensitive
- LoginId should be uppercase
- Timestamps are automatic (don't send them)
- Password is never returned in responses
- Soft deletes preserve data (not permanently deleted)
- All dates are in UTC/ISO format

---

## Ready to Test!

The API is fully functional. Start with:
1. Create a test manager
2. Verify it appears in get all
3. Try forgot password flow
4. Test login with new credentials

Let me know if you encounter any issues!
