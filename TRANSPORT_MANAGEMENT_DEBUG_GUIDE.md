# Transport Management Dashboard Routing - Debug Guide

## Changes Made

### 1. Simplified Routing Logic in `sign-in.js`
The routing logic has been completely restructured to check Department FIRST before checking AccountType:

```javascript
// NEW LOGIC - Department takes priority
if(response.data.Department === "Transport Management"){
  navigate('/hp-dashboard');
}
else if(HP job titles...){
  navigate('/hp-dashboard');
}
else if(AccountType checks...){
  // Handle other account types
}
```

**Previous Issue**: The old logic only checked Department within specific AccountType conditions, so if Transport Management users had a different AccountType, they would be routed to Customer Dashboard.

**New Solution**: Department is checked FIRST, regardless of AccountType.

### 2. Added Console Logging
Added debug logging to help identify the issue:

**In sign-in.js:**
```javascript
console.log("Routing decision - AccountType:", response.data.AccountType, 
            "Position:", response.data.Position, 
            "Department:", response.data.Department, 
            "JobTitle:", response.data.JobTitle);
```

**In landingPage.js:**
```javascript
console.log("Landing Page - Department:", department, "JobTitle:", jobTitle);
console.log("Navigating to HP Dashboard" or "Navigating to Customer Dashboard");
```

## How to Debug

### Step 1: Check Browser Console During Login
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Login with a Transport Management user
4. Look for the console.log output that shows:
   - AccountType
   - Position
   - Department
   - JobTitle

### Step 2: Verify Department Value
The Department value should be EXACTLY: `"Transport Management"`

**Common Issues:**
- Extra spaces: `"Transport Management "` (trailing space)
- Different case: `"transport management"` or `"TRANSPORT MANAGEMENT"`
- Different name: `"Transportation Management"` or `"TM"`

### Step 3: Check localStorage
After login, in the Console tab, run:
```javascript
console.log("Department:", localStorage.getItem("Department"));
console.log("JobTitle:", localStorage.getItem("JobTitle"));
console.log("Position:", localStorage.getItem("Position"));
console.log("AccountType:", localStorage.getItem("AccountType"));
```

### Step 4: Verify Database Value
Check the database `users` table for the Transport Management user:
```sql
SELECT user_name, Department, Position, JobTitle, AccountType 
FROM users 
WHERE Department LIKE '%Transport%';
```

## Expected Behavior

### For Transport Management Users:
1. **Login**: Should see console log showing Department = "Transport Management"
2. **Routing**: Should see "Routing to HP Dashboard - Transport Management department"
3. **Navigation**: Should be redirected to `/hp-dashboard`
4. **Sidebar**: Should see "HP Dashboard" menu item

### For Other Users:
1. **HP Job Titles**: Should see "Routing to HP Dashboard - HP job title"
2. **Others**: Should see "Routing to Customer Dashboard - default fallback"

## Troubleshooting

### Issue: Still routing to Customer Dashboard

**Possible Causes:**

1. **Department name mismatch**
   - Solution: Check exact Department value in database
   - Fix: Update database or update code to match exact value

2. **Department is NULL or empty**
   - Solution: Check if Department field is populated in database
   - Fix: Update user record to set Department = "Transport Management"

3. **Browser cache**
   - Solution: Clear browser cache and localStorage
   - Fix: Run in Console: `localStorage.clear()` then login again

4. **Old build**
   - Solution: Rebuild the React app
   - Fix: Run `npm run build` in clients folder

### Issue: Console logs not appearing

**Possible Causes:**

1. **Using old build**
   - Solution: Make sure you're running the development server
   - Fix: Run `npm start` in clients folder

2. **Console filtered**
   - Solution: Check Console filter settings
   - Fix: Make sure "All levels" is selected in Console

## Quick Fix Commands

### Clear localStorage and test:
```javascript
// In browser console
localStorage.clear();
// Then login again
```

### Check current routing logic:
```javascript
// In browser console after login
const dept = localStorage.getItem("Department");
const job = localStorage.getItem("JobTitle");
console.log("Should route to HP?", dept === "Transport Management" || job === "Dispatcher - HP");
```

### Manual navigation test:
```javascript
// In browser console
window.location.href = '/hp-dashboard';
```

## Files Modified

1. `clients/src/components/UserAccount/sign-in.js` - Simplified routing logic with Department priority
2. `clients/src/landingPage.js` - Added console logging and simplified logic
3. `clients/src/components/Navbar/Navbar2.js` - Already updated to check Department

## Next Steps

1. Login with Transport Management user
2. Check browser console for the debug logs
3. Share the console output to identify the exact issue
4. Verify Department value matches exactly "Transport Management"
5. If Department is different, either:
   - Update the code to match the actual Department value, OR
   - Update the database to use "Transport Management"
