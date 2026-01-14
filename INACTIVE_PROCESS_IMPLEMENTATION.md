# Inactive Process Implementation Summary

## Overview
Implemented inactive process display logic across all HP service unit pages. Processes that have completed their stage are now shown as inactive (grey background, 60% opacity) but remain visible in the table for tracking purposes.

## Implementation Details

### 1. Dispatch Management (`DispatchManagement.js`)
**Stage**: Dispatch
**Previous Stage**: Vehicle Assignment (PI)
**Next Stage**: Documentation

**Logic**:
- Shows all routes with vehicle assignments (previous stage completed)
- Marks as inactive if `assignment_status === 'Completed'`
- Inactive routes show "Passed to Documentation" chip instead of "Complete" button
- Grey background with 60% opacity for inactive rows

**Key Changes**:
- Added `includeAll: true` parameter to API call to fetch both active and completed dispatches
- Added `isInactive` check based on `assignment_status`
- Applied grey styling: `bgcolor: 'grey.100'`, `opacity: 0.6`
- Replaced "Completed" chip with "Passed to Documentation" chip for inactive rows

---

### 2. Documentation Management (`DocumentationManagement.js`)
**Stage**: POD Confirmation
**Previous Stage**: Dispatch
**Next Stage**: Document Follow-up

**Logic**:
- Shows all dispatched ODNs (previous stage completed)
- Marks as inactive if `pod_confirmed === 1`
- Inactive ODNs show "✓ Confirmed" + "Passed to Follow-up" chips
- Disables POD checkbox and reason field for inactive rows
- Grey background with 60% opacity for inactive rows

**Key Changes**:
- Added `isInactive` check based on `pod_confirmed` status
- Applied grey styling: `bgcolor: 'grey.100'`, `opacity: 0.6`
- Replaced POD checkbox with status chips for inactive rows
- Shows "POD confirmed - no reason needed" message instead of reason field

---

### 3. Document Follow-up (`DocumentFollowup.js`)
**Stage**: Document Signing & Handover
**Previous Stage**: POD Confirmation
**Next Stage**: Quality Evaluation

**Logic**:
- Shows all ODNs with confirmed POD (previous stage completed)
- Marks as inactive if BOTH `documents_signed === 1` AND `documents_handover === 1`
- Inactive ODNs show "✓ Done" chips + "Passed to Quality" chip
- Disables checkboxes for inactive rows
- Grey background with 60% opacity for inactive rows

**Key Changes**:
- Added `isInactive` check: `documents_signed && documents_handover`
- Applied grey styling: `bgcolor: 'grey.100'`, `opacity: 0.6`
- Replaced checkboxes with status chips for inactive rows
- Shows "Passed to Quality" chip in the last column for inactive rows

---

### 4. Quality Evaluation (`QualityEvaluation.js`)
**Stage**: Quality Confirmation
**Previous Stage**: Document Follow-up (both signed and handover)
**Next Stage**: Process Complete

**Logic**:
- Shows all ODNs with completed document follow-up (previous stage completed)
- Marks as inactive if `quality_confirmed === 1`
- Inactive ODNs show "Process Complete" chip instead of "Edit" button
- Grey background with 60% opacity for inactive rows

**Key Changes**:
- Added `isInactive` check based on `quality_confirmed` status
- Applied grey styling: `bgcolor: 'grey.100'`, `opacity: 0.6`
- Replaced "Edit" button with "Process Complete" chip for inactive rows
- Maintains quality status and feedback display for all rows

---

## Workflow Summary

```
O2C → EWM → PI (Vehicle Request) → Dispatch → Documentation → Follow-up → Quality
```

### Stage Visibility Rules:
1. **O2C Page**: Shows all processes, inactive if passed O2C stage
2. **EWM Page**: Shows only processes that completed O2C, inactive if passed EWM stage
3. **PI Vehicle Requests**: Shows only processes that completed EWM, inactive if vehicle requested
4. **Dispatch Management**: Shows only routes with vehicle assigned, inactive if dispatch completed
5. **Documentation Management**: Shows only dispatched ODNs, inactive if POD confirmed
6. **Document Follow-up**: Shows only ODNs with confirmed POD, inactive if both documents signed and handover completed
7. **Quality Evaluation**: Shows only ODNs with completed follow-up, inactive if quality confirmed

---

## Visual Indicators

### Active Process:
- Normal white background
- Full opacity (1.0)
- Action buttons enabled
- Editable fields

### Inactive Process:
- Grey background (`bgcolor: 'grey.100'`)
- Reduced opacity (0.6)
- Action buttons replaced with status chips
- Fields disabled or replaced with status messages
- Shows "Passed to [Next Stage]" chip

---

## Benefits

1. **Complete Visibility**: All processes remain visible for tracking and auditing
2. **Clear Status**: Visual distinction between active and completed processes
3. **Process Flow**: "Passed to" chips show where the process moved to
4. **No Data Loss**: Historical data remains accessible
5. **User Experience**: Clear indication of which processes need attention

---

## Files Modified

1. `clients/src/components/Transportation/DispatchManagement.js`
2. `clients/src/components/Documentation/DocumentationManagement.js`
3. `clients/src/components/Documentation/DocumentFollowup.js`
4. `clients/src/components/Quality/QualityEvaluation.js`

All changes follow the same pattern established in:
- `clients/src/components/Customer-Service/HealthProgram/HP-Facilities.js` (O2C and EWM sections)
- `clients/src/components/Customer-Service/HealthProgram/PIVehicleRequests.js`

---

## Testing Recommendations

1. Test each page with processes at different stages
2. Verify inactive styling appears correctly
3. Confirm action buttons are disabled for inactive processes
4. Check that "Passed to" chips show correct next stage
5. Verify filtering still works with inactive processes visible
6. Test that stats update correctly when processes move between stages
