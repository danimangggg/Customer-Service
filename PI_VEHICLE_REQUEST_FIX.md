# PI Vehicle Request - Route Grouping Fix

## Problem
Route AD-R-2 has 3 facilities total, but only 2 have completed EWM. The "Request Vehicle" button was appearing even though not ALL facilities in the route had completed EWM.

## Root Cause
The SQL query had a critical flaw:

**OLD QUERY:**
```sql
INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
WHERE p.status IN ('ewm_completed', 'vehicle_requested')
```

This filtered facilities BEFORE counting them, so:
- If a route had 3 facilities
- But only 2 had status `ewm_completed`
- The query would only see those 2 facilities
- It would think: "2 facilities total, 2 have ewm_completed = 100% complete!"
- The route would appear in the list

**The Missing Facility:**
The 3rd facility with status `o2c_completed` or `o2c_started` was completely ignored by the query.

## Solution

### 1. Fixed Main Query
**NEW QUERY:**
```sql
INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
WHERE f.route IS NOT NULL AND f.period IS NOT NULL
-- NO status filter in WHERE clause!
```

Now counts ALL facilities in the route for the reporting month, then checks if ALL have `ewm_completed`:

```sql
HAVING total_facilities_in_route > 0 AND (
  (ewm_completed_facilities = total_facilities_in_route) OR 
  (vehicle_requested_facilities = total_facilities_in_route)
)
```

### 2. Updated Facilities Query
Changed to show ALL facilities with their status:
```sql
SELECT DISTINCT 
  f.id,
  f.facility_name,
  p.status as process_status
FROM facilities f
INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
WHERE f.route = ?
```

This allows the UI to show all 3 facilities and their current status.

### 3. Enhanced Logging
Added detailed logging to help debug:
```javascript
console.log(`Route: ${route.route_name}, Total Facilities: ${route.total_facilities_in_route}, EWM Completed: ${route.ewm_completed_facilities}`);
console.log(`Route ${route.route_name} facilities:`, facilities.map(f => `${f.facility_name} (${f.process_status})`).join(', '));
```

### 4. Updated Verification in Submit
When submitting a vehicle request, now properly verifies:
```javascript
if (verification[0].total_facilities !== verification[0].ewm_completed_facilities) {
  return res.status(400).json({ 
    error: `Not all facilities in this route have completed EWM process. Total: ${verification[0].total_facilities}, EWM Completed: ${verification[0].ewm_completed_facilities}`
  });
}
```

## Expected Behavior After Fix

### Scenario: Route AD-R-2 with 3 Facilities

**Before Fix:**
- Facility 1: `ewm_completed` ✓
- Facility 2: `ewm_completed` ✓
- Facility 3: `o2c_completed` (ignored by query)
- **Result**: Route appears with "Request Vehicle" button (WRONG!)

**After Fix:**
- Facility 1: `ewm_completed` ✓
- Facility 2: `ewm_completed` ✓
- Facility 3: `o2c_completed` ✗
- **Result**: Route does NOT appear in PI Vehicle Requests page (CORRECT!)

### When Route Will Appear:
Only when ALL 3 facilities have `ewm_completed` status:
- Facility 1: `ewm_completed` ✓
- Facility 2: `ewm_completed` ✓
- Facility 3: `ewm_completed` ✓
- **Result**: Route appears with "Request Vehicle" button ✓

## Testing

### Test Case 1: Incomplete Route
1. Create a route with 3 facilities
2. Complete EWM for only 2 facilities
3. Go to PI Vehicle Requests page
4. **Expected**: Route should NOT appear

### Test Case 2: Complete Route
1. Complete EWM for the 3rd facility
2. Refresh PI Vehicle Requests page
3. **Expected**: Route NOW appears with all 3 facilities listed
4. **Expected**: Shows "3 Facilities (All EWM Completed ✓)"

### Test Case 3: Attempt Early Request
1. Try to request vehicle for incomplete route via API
2. **Expected**: Error message: "Not all facilities in this route have completed EWM process. Total: 3, EWM Completed: 2"

### Test Case 4: Check Server Logs
After the fix, server logs will show:
```
Route: AD-R-2, Total Facilities: 3, EWM Completed: 2, Vehicle Requested: 0
Route AD-R-2 facilities: Facility A (ewm_completed), Facility B (ewm_completed), Facility C (o2c_completed)
```

This makes it clear why the route is not appearing.

## Files Modified

1. `server/src/controllers/CustomerService/piVehicleRequestController.js`
   - Fixed main query to count ALL facilities
   - Updated facilities query to show all facilities with status
   - Enhanced logging for debugging
   - Updated verification logic in submitVehicleRequest
   - Fixed count query for pagination
   - Fixed stats query

## Database Impact

No database schema changes required. The fix is purely in the query logic.

## API Response Changes

### Before:
```json
{
  "route_id": 1,
  "route_name": "AD-R-2",
  "total_facilities": 2,  // WRONG - only counted ewm_completed
  "facilities": [
    {"facility_name": "Facility A"},
    {"facility_name": "Facility B"}
  ]
}
```

### After:
```json
{
  "route_id": 1,
  "route_name": "AD-R-2",
  "total_facilities_in_route": 3,  // CORRECT - counts all
  "ewm_completed_facilities": 2,
  "facilities": [
    {"facility_name": "Facility A", "process_status": "ewm_completed"},
    {"facility_name": "Facility B", "process_status": "ewm_completed"},
    {"facility_name": "Facility C", "process_status": "o2c_completed"}
  ]
}
```

Note: If the route doesn't meet the criteria (all facilities ewm_completed), it won't be returned at all.

## Benefits

1. **Accurate Counting**: Now counts ALL facilities in a route, not just those with certain statuses
2. **Correct Filtering**: Only shows routes where 100% of facilities have completed EWM
3. **Better Visibility**: Shows all facilities with their current status
4. **Enhanced Debugging**: Detailed logs help identify issues
5. **Prevents Errors**: Verification prevents premature vehicle requests

## Verification Steps

1. Check server logs when loading PI Vehicle Requests page
2. Look for the route count and facility details
3. Verify that routes with incomplete facilities don't appear
4. Verify that only routes with ALL facilities ewm_completed appear
5. Try to request vehicle - should get clear error if not all facilities ready
