# Session Isolation Architecture

> This document explains how the 4 different login sections work independently without interfering with each other.

---

## 🏗️ Architecture Overview

RoomHy has **4 separate login sections**, each with **isolated session storage**:

| Section | Location | Storage Key | Users | Purpose |
|---------|----------|-------------|-------|---------|
| **Staff Login** | `/index.html` | `staff_user` | SuperAdmin<br>Manager<br>Employee | Internal staff management |
| **Owner Login** | `/propertyowner/index.html` | `owner_user` | Property Owners | Owner dashboard & operations |
| **Website/Tenant** | `/website/signup.html` | `website_user` | Website Visitors<br>Tenants | Website signup & login |
| **Legacy** | All pages | `user` | - | Backward compatibility (fallback) |

---

## 🔑 Storage Keys

### Staff Login (`/index.html`)
```javascript
// Stored after login:
localStorage.setItem('staff_user', JSON.stringify(user));  // Main session
sessionStorage.setItem('staff_user', JSON.stringify(user)); // Transient
localStorage.setItem('staff_token', tokenValue);           // Auth token

// Clears other sessions:
localStorage.removeItem('owner_user');
localStorage.removeItem('website_user');
```

### Owner Login (`/propertyowner/index.html`)
```javascript
// Stored after login:
localStorage.setItem('owner_user', JSON.stringify(user));      // Main session
sessionStorage.setItem('owner_session', JSON.stringify(user));  // Transient
localStorage.setItem('owner_accounts', JSON.stringify(accounts)); // Multi-account support

// Clears other sessions:
localStorage.removeItem('staff_user');
localStorage.removeItem('website_user');
localStorage.removeItem('staff_token');
```

### Website/Tenant (`/website/signup.html`)
```javascript
// Stored after signup/login:
localStorage.setItem('website_user', JSON.stringify(user));       // Main session
sessionStorage.setItem('website_user', JSON.stringify(user));     // Transient

// Clears other sessions:
localStorage.removeItem('staff_user');
localStorage.removeItem('owner_user');
localStorage.removeItem('staff_token');
```

---

## 🔐 Session Priority (getCurrentUser())

The `auth-utils.js` checks for user sessions in this priority order:

```
website_user (from sessionStorage/localStorage)
  ↓
staff_user (from sessionStorage/localStorage)
  ↓
owner_user (from sessionStorage/localStorage)
  ↓
legacy user key (backward compatibility)
```

This ensures:
- ✅ Website pages work with website tenants
- ✅ Staff pages work with staff users
- ✅ Owner pages work with owner users
- ✅ No cross-contamination between sections

---

## 🚀 How It Works

### Scenario 1: Staff Login with Website Already Logged In

```
BEFORE:
- localStorage['website_user'] = tenant data
- localStorage['owner_user'] = empty

STAFF LOGIN:
1. Clear website_user, owner_user
2. Set staff_user with employee data
3. Redirect to /Areamanager/areaadmin.html

AFTER:
- localStorage['staff_user'] = employee data ✅
- localStorage['website_user'] = removed
```

### Scenario 2: Owner Login with Staff Already Logged In

```
BEFORE:
- localStorage['staff_user'] = manager data
- sessionStorage['staff_user'] = manager data

OWNER LOGIN:
1. Clear staff_user, staff_token
2. Set owner_user with owner data
3. Redirect to /propertyowner/admin.html

AFTER:
- localStorage['owner_user'] = owner data ✅
- localStorage['staff_user'] = removed
```

### Scenario 3: Website Signup with Owner Logged In

```
BEFORE:
- sessionStorage['owner_session'] = owner data
- localStorage['owner_user'] = owner data

WEBSITE SIGNUP:
1. Clear owner_user, staff_user
2. Set website_user with tenant data
3. Redirect to /website/index.html

AFTER:
- localStorage['website_user'] = tenant data ✅
- localStorage['owner_user'] = removed
```

---

## 📁 Files Updated

### Login Pages
- ✅ `/index.html` - Staff login (uses `staff_user`)
- ✅ `/propertyowner/index.html` - Owner login (uses `owner_user`)
- ✅ `/website/signup.html` - Website tenant login/signup (uses `website_user`)

### Core Utilities
- ✅ `/website/js/auth-utils.js` - Updated `getCurrentUser()` to check all session keys

---

## 🔄 Migration from Old System

If users have old sessions in `user` key:
- ✅ Still supported via `auth-utils.js` fallback
- ⚠️ Will be phased out after new system is stable
- 🔄 Recommend clearing cache: `localStorage.clear()`

---

## ✨ Benefits

| Benefit | Impact |
|---------|--------|
| **No Crosstalk** | Logging in as staff doesn't affect owner session |
| **Multiple Logins** | One user can be logged in to different sections |
| **Clear Separation** | Each section is independent and isolated |
| **Backward Compatible** | Old `user` key still works as fallback |
| **Easy Debugging** | Check DevTools → Application → localStorage for specific user type |

---

## 🐛 Debugging Tips

1. **Check Current User Type:**
   ```javascript
   // In browser console:
   JSON.parse(localStorage.getItem('staff_user'));    // Staff user?
   JSON.parse(localStorage.getItem('owner_user'));    // Owner user?
   JSON.parse(localStorage.getItem('website_user'));  // Website user?
   ```

2. **Verify Session Isolation:**
   - Staff Login → Check only `staff_user` is set
   - Owner Login → Check only `owner_user` is set
   - Website Login → Check only `website_user` is set

3. **Clear All Sessions:**
   ```javascript
   localStorage.removeItem('staff_user');
   localStorage.removeItem('owner_user');
   localStorage.removeItem('website_user');
   localStorage.removeItem('user');
   localStorage.removeItem('staff_token');
   ```

---

## 📝 Summary

✅ **Before:** All logins used `user` key → Conflicts  
✅ **After:** Each login type uses isolated key → No conflicts  
✅ **Result:** Users can switch between sections without issues
