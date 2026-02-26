# Debug: Exit Permit Edit 500 Error

## Error Details
```
PUT http://10.2.32.150:3001/api/update-service-status/2829 500 (Internal Server Error)
```

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
```
=== EDIT SAVE DEBUG ===
Record ID: 2829
Update data: { ... }
```

This will show exactly what data is being sent to the server.

### 2. Check Server Logs
Look at the terminal where the server is running. You should see:
```
=== UPDATE SERVICE STATUS ===
Record ID: 2829
Request body: { ... }
Update data to be saved: { ... }
```

And if there's an error:
```
Update service status error: [error message]
```

### 3. Common Causes

#### A. Field Type Mismatch
- `facility_id` might be sent as string but expected as number
- `receipt_count` might be sent as string but expected as number
- `total_amount` might be sent as string but expected as decimal

#### B. ENUM Value Error
- `customer_type` must be exactly 'Cash' or 'Credit' (case-sensitive)
- `measurement_unit` might have invalid value

#### C. Foreign Key Constraint
- `facility_id` might reference a non-existent facility
- `assigned_gate_keeper_id` might reference a non-existent user

#### D. NULL Constraint
- Some required field might be missing or null

## Frontend Fix Applied

### Before
Sent all fields even if empty:
```javascript
{
  facility_id: '',  // Empty string might cause error
  vehicle_plate: '',
  receipt_count: '',
  // ...
}
```

### After
Only send fields with values:
```javascript
const updateData = {};
if (editFormData.facility_id) updateData.facility_id = editFormData.facility_id;
if (editFormData.vehicle_plate) updateData.vehicle_plate = editFormData.vehicle_plate;
// Only includes fields that have actual values
```

## Testing Instructions

### Step 1: Open Browser Console
1. Press F12
2. Go to Console tab
3. Clear console (trash icon)

### Step 2: Try to Edit
1. Go to Exit Permit → History tab
2. Click Edit on record ID 2829
3. Make a small change (e.g., change vehicle plate)
4. Click "Save Changes"

### Step 3: Check Console Output
Look for:
```
=== EDIT DIALOG DEBUG ===
Record gate keeper ID: ...
Converted gate keeper ID: ...
Available gate keepers: ...
Matching gate keeper: ...

=== EDIT SAVE DEBUG ===
Record ID: 2829
Update data: { ... }

=== EDIT SAVE ERROR ===
Error: ...
Error response: { message: "..." }
Error status: 500
```

### Step 4: Check Server Terminal
Look for:
```
=== UPDATE SERVICE STATUS ===
Record ID: 2829
Request body: { ... }
Update data to be saved: { ... }
Update result (rows affected): ...

OR

Update service status error: [specific error message]
```

## Likely Solutions

### Solution 1: Type Conversion
If the error is about type mismatch, convert types in frontend:
```javascript
updateData.facility_id = parseInt(editFormData.facility_id);
updateData.receipt_count = parseInt(editFormData.receipt_count);
updateData.total_amount = parseFloat(editFormData.total_amount);
```

### Solution 2: ENUM Validation
If the error is about ENUM values, ensure exact match:
```javascript
// customer_type must be 'Cash' or 'Credit' (capital first letter)
updateData.customer_type = editFormData.customer_type;

// measurement_unit must match allowed values
const validUnits = ["Carton", "Box", "Package", "Bottle", "Others"];
if (validUnits.includes(editFormData.measurement_unit)) {
  updateData.measurement_unit = editFormData.measurement_unit;
}
```

### Solution 3: Foreign Key Check
If the error is about foreign keys, validate before sending:
```javascript
// Check if facility exists
if (editFormData.facility_id) {
  const facilityExists = facilities.find(f => f.id == editFormData.facility_id);
  if (facilityExists) {
    updateData.facility_id = editFormData.facility_id;
  }
}
```

### Solution 4: Backend Fix
If the backend is rejecting valid data, update the controller:
```javascript
// In server/src/controllers/CustomerService/firstUpdate.js
const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Add type conversions
    if (req.body.facility_id !== undefined) {
      updateData.facility_id = parseInt(req.body.facility_id);
    }
    if (req.body.receipt_count !== undefined) {
      updateData.receipt_count = parseInt(req.body.receipt_count);
    }
    if (req.body.total_amount !== undefined) {
      updateData.total_amount = parseFloat(req.body.total_amount);
    }
    
    // ... rest of the code
  } catch (error) {
    console.error("Update service status error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).send({ 
      message: error.message || 'Failed to update service status',
      details: error.toString()
    });
  }
};
```

## Next Steps

1. ✅ Frontend now only sends fields with values
2. ✅ Frontend logs detailed debug info
3. ✅ Frontend shows specific error messages
4. ⏳ Check server logs for exact error
5. ⏳ Apply appropriate solution based on error

## Quick Test

Try editing a different record (not 2829) to see if:
- Same error occurs (backend issue)
- Different error occurs (data-specific issue)
- No error occurs (record 2829 has bad data)

## Contact Points

If error persists:
1. Share the console output (=== EDIT SAVE DEBUG === section)
2. Share the server terminal output
3. Share the specific error message from server logs
4. We can then apply the exact fix needed
