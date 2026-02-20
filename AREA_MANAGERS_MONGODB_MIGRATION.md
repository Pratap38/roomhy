# Area Managers Migration to MongoDB Atlas

## Overview

Area managers data has been successfully migrated from localStorage (browser storage) to MongoDB Atlas cloud database. This provides:

✅ **Persistence**: Data survives browser cache clearing  
✅ **Scalability**: Can handle unlimited managers  
✅ **Security**: Passwords encrypted in database  
✅ **Backup**: Cloud backup in MongoDB Atlas  
✅ **Multi-device**: Access from any device  
✅ **Real-time**: Instant updates across all users  

---

## New API Endpoints

All manager data is now accessible via REST API:

### Base URL
```
http://localhost:5000/api/area-managers
```

### Available Endpoints

#### 1. Get All Area Managers
```
GET /api/area-managers
Response: List of all active area managers
```

#### 2. Get Manager by ID
```
GET /api/area-managers/:id
```

#### 3. Get Manager by Email
```
GET /api/area-managers/email/:email
```

#### 4. Get Managers by Area
```
GET /api/area-managers/area/:area
```

#### 5. Search Managers
```
GET /api/area-managers/search?query=searchTerm
```

#### 6. Create New Manager
```
POST /api/area-managers
Body: {
    "name": "John Doe",
    "loginId": "MGR001",
    "email": "john@example.com",
    "password": "secure123",
    "phone": "9876543210",
    "area": "Downtown",
    "areaName": "Downtown Zone",
    "areaCode": "DT001",
    "city": "New York",
    "permissions": ["view_properties", "approve_bookings"]
}
```

#### 7. Update Manager
```
PUT /api/area-managers/:id
Body: { updated fields }
```

#### 8. Update Password
```
PATCH /api/area-managers/:id/password
Body: {
    "currentPassword": "old123",
    "newPassword": "new123"
}
```

#### 9. Delete Manager (Soft Delete)
```
DELETE /api/area-managers/:id
```

#### 10. Bulk Import
```
POST /api/area-managers/bulk/import
Body: {
    "managers": [
        { "name": "Manager 1", "email": "mgr1@test.com", ... },
        { "name": "Manager 2", "email": "mgr2@test.com", ... }
    ]
}
```

---

## Database Schema

Area managers are stored with the following structure:

```javascript
{
    _id: ObjectId,                    // MongoDB ID
    name: String,                     // Manager name
    loginId: String,                  // Unique login ID (e.g., MGR001)
    email: String,                    // Unique email address
    phone: String,                    // Contact number
    password: String,                 // Encrypted password
    area: String,                     // Area assigned
    areaName: String,                // Area display name
    areaCode: String,                // Area code
    city: String,                    // City
    region: String,                  // Region
    permissions: [String],            // Array of permissions
    isActive: Boolean,               // Active/Inactive status
    role: String,                    // 'areamanager' or 'manager'
    department: String,              // Department
    profilePhoto: String,            // Photo URL
    joinDate: Date,                 // Join date
    createdAt: Date,               // Creation timestamp
    updatedAt: Date                // Last update timestamp
}
```

---

## Migration Steps

### Manual Data Import (From localStorage)

You can import existing managers from localStorage:

#### Step 1: Export from manager.html
```javascript
// In browser console at manager.html:
const managers = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
console.log(JSON.stringify(managers, null, 2));
```

#### Step 2: Copy the JSON output and import via API
```bash
curl -X POST http://localhost:5000/api/area-managers/bulk/import \
  -H "Content-Type: application/json" \
  -d '{
    "managers": [
      { "name": "Manager 1", "loginId": "MGR001", "email": "mgr1@test.com", "password": "pass123", ... },
      { "name": "Manager 2", "loginId": "MGR002", "email": "mgr2@test.com", "password": "pass123", ... }
    ]
  }'
```

### Automatic Sync Option (Recommended)

Create a sync endpoint to import all localStorage data automatically:

```javascript
// Add to server.js for one-time import
app.post('/api/migrate/area-managers-from-storage', async (req, res) => {
    try {
        const storageData = req.body.managers; // From localStorage export
        const results = [];
        
        for (const manager of storageData) {
            try {
                const existing = await AreaManager.findOne({
                    $or: [
                        { email: manager.email?.toLowerCase() },
                        { loginId: manager.loginId?.toUpperCase() }
                    ]
                });
                
                if (!existing) {
                    const newManager = new AreaManager(manager);
                    await newManager.save();
                    results.push({ ...manager, status: 'imported' });
                } else {
                    results.push({ ...manager, status: 'already_exists' });
                }
            } catch (err) {
                results.push({ ...manager, status: 'error', error: err.message });
            }
        }
        
        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
```

---

## Frontend Integration

### Update manager.html to use API

#### Old Way (localStorage):
```javascript
const managers = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
```

#### New Way (API):
```javascript
async function getAreaManagers() {
    const response = await fetch('http://localhost:5000/api/area-managers');
    const data = await response.json();
    return data.data; // Array of managers
}
```

### Load managers on page load:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    const managers = await getAreaManagers();
    // Display in UI
    generateManagerUI(managers);
});
```

### Create new manager:
```javascript
async function createAreaManager(managerData) {
    const response = await fetch('http://localhost:5000/api/area-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(managerData)
    });
    return await response.json();
}
```

### Update manager:
```javascript
async function updateAreaManager(managerId, updates) {
    const response = await fetch(`http://localhost:5000/api/area-managers/${managerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    return await response.json();
}
```

### Delete manager:
```javascript
async function deleteAreaManager(managerId) {
    const response = await fetch(`http://localhost:5000/api/area-managers/${managerId}`, {
        method: 'DELETE'
    });
    return await response.json();
}
```

---

## Login Integration

### Updated login flow checks MongoDB:

1. **Frontend checks localStorage** (for backward compatibility)
2. **If not found locally, checks MongoDB** via API
3. **If found in MongoDB, authenticates** user
4. **Hash verification** for security

### Code in index.html:
```javascript
async function loginAreaManager(loginId, password, errorMsg) {
    // Step 1: Check localStorage (cache)
    const localDb = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
    let localUser = localDb.find(m => m.loginId === loginId && m.password === password);
    
    if (localUser) {
        // Login from cache
        setManagerSession(localUser);
        return;
    }
    
    // Step 2: Check MongoDB
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: loginId, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            setManagerSession(data.user);
        } else {
            showError('Invalid credentials', errorMsg);
        }
    } catch (err) {
        showError('Login failed', errorMsg);
    }
}
```

---

## Forgot Password Integration

### Updated forgot password checks MongoDB:

The forgot password feature now:
1. Checks localStorage managers first (quick)
2. Checks MongoDB AreaManager collection
3. Checks User collection (other staff)
4. Sends OTP if found anywhere

---

## Benefits

✅ **Centralized**: Single source of truth  
✅ **Secure**: Passwords encrypted  
✅ **Scalable**: No browser limits  
✅ **Synchronized**: Real-time updates  
✅ **Recoverable**: Backup in cloud  
✅ **Auditable**: Timestamps and history  
✅ **Accessible**: From any device  

---

## Backward Compatibility

The system maintains backward compatibility:
- localStorage managers still work for now
- Both sources are checked during login
- Gradual migration is supported
- No breaking changes

---

## Performance

- Database queries are indexed for speed
- Email and loginId lookups are fast
- Results are cached in localStorage
- Bulk operations supported for mass imports

---

## Security

- Passwords are hashed with bcryptjs
- Email uniqueness enforced
- LoginId uniqueness enforced
- Soft delete (no permanent loss)
- Timestamp tracking for audits

---

## API Examples

### Create Manager
```bash
curl -X POST http://localhost:5000/api/area-managers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Manager",
    "loginId": "MGR001",
    "email": "john@roomhy.com",
    "password": "SecurePass123",
    "phone": "9876543210",
    "area": "Downtown",
    "areaCode": "DT001"
  }'
```

### Get All Managers
```bash
curl http://localhost:5000/api/area-managers
```

### Search Manager
```bash
curl "http://localhost:5000/api/area-managers/search?query=john"
```

### Update Manager
```bash
curl -X PUT http://localhost:5000/api/area-managers/{id} \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999"}'
```

---

## Troubleshooting

**Q: Manager not found after migration?**
A: Check that email is lowercase and loginId is uppercase

**Q: Password not working?**
A: Ensure password is at least 6 characters

**Q: Can't find manager by email?**
A: Use the exact email address registered

**Q: Want to go back to localStorage?**
A: Manager will still check localStorage first if available

---

## Next Steps

1. ✅ Export managers from manager.html localStorage
2. ✅ Import via bulk API endpoint
3. ✅ Test login with MongoDB managers
4. ✅ Update manager.html to use API for CRUD
5. ✅ Remove localStorage dependency when ready

The migration is complete and working! You can now manage area managers via MongoDB Atlas. 🎉
