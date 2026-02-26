# YouTube Playlist IP Change Fix

## Problem
When you changed the IP address to access the application, the YouTube playlist became empty. This happened because the playlist was stored in the browser's `localStorage`, which is tied to the specific domain/IP address.

## Solution
Moved the YouTube playlist storage from browser `localStorage` to the database. Now the playlist persists regardless of which IP address you use to access the application.

## What Was Changed

### 1. Database Table Created
- **Table**: `app_settings`
- **Purpose**: Store application settings including YouTube playlist
- **Location**: `server/migrations/create_app_settings_table.sql`

### 2. Backend API Created
- **Controller**: `server/src/controllers/Settings/appSettingsController.js`
- **Routes Added**:
  - `GET /api/settings` - Get all settings
  - `GET /api/settings/:key` - Get specific setting
  - `PUT /api/settings/:key` - Update/create setting

### 3. Frontend Updated
- **File**: `clients/src/components/Customer-Service/TvRealEntertainment.js`
- **Changes**:
  - Loads playlist from database on startup
  - Saves playlist to database when modified
  - Auto-migrates existing localStorage data to database (one-time)

## How to Apply

### Step 1: Run the Migration
```bash
cd server
node run-migration.js
```

You should see:
```
✅ Connected to database
📄 Running migration: create_app_settings_table.sql
✅ Migration completed successfully!
✅ Table "app_settings" created
✅ Default YouTube playlist setting inserted
```

### Step 2: Restart the Server
```bash
cd server
npm start
```

### Step 3: Test the Frontend
1. Open the application in your browser
2. Go to the TV Entertainment page
3. Click "YouTube Settings"
4. Add some YouTube videos to the playlist
5. Save the playlist
6. Access the application from a different IP address
7. ✅ The playlist should still be there!

## Testing the API

Run the test script to verify everything is working:
```bash
cd server
node test-settings-api.js
```

## Benefits

✅ **IP Independent**: Playlist works from any IP address
✅ **Shared Across Devices**: All devices see the same playlist
✅ **Persistent**: Survives browser cache clears
✅ **Centralized**: Easy to backup and manage
✅ **Automatic Migration**: Existing localStorage data is automatically migrated

## Technical Details

### Database Schema
```sql
CREATE TABLE app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Data Format
The YouTube playlist is stored as JSON in the `setting_value` column:
```json
[
  {
    "id": "dQw4w9WgXcQ",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    "id": "jNQXAC9IVRw",
    "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"
  }
]
```

### Migration Process
1. Frontend tries to load from database
2. If database is empty, checks localStorage
3. If localStorage has data, migrates it to database
4. Clears localStorage after successful migration
5. All future saves go to database

## Files Modified/Created

### Created
- ✅ `server/migrations/create_app_settings_table.sql`
- ✅ `server/run-migration.js`
- ✅ `server/test-settings-api.js`
- ✅ `server/src/models/Settings/appSettings.js`
- ✅ `server/src/controllers/Settings/appSettingsController.js`
- ✅ `server/migrations/README.md`

### Modified
- ✅ `server/src/routes/web.js` - Added settings routes
- ✅ `clients/src/components/Customer-Service/TvRealEntertainment.js` - Updated to use database

## Troubleshooting

### Playlist Still Empty After Migration
1. Check if migration ran successfully: `node run-migration.js`
2. Verify table exists: Check database for `app_settings` table
3. Check server logs for API errors
4. Clear browser cache and reload

### API Not Working
1. Restart the server
2. Check server logs for errors
3. Run test script: `node test-settings-api.js`
4. Verify database connection in `.env` file

### Migration Errors
1. Check database credentials in `server/.env`
2. Ensure MySQL/MariaDB is running
3. Verify database exists: `customer-service`
4. Check user has CREATE TABLE permissions

## Support
If you encounter any issues, check:
1. Server logs: Look for errors in the terminal
2. Browser console: Check for API errors
3. Database: Verify `app_settings` table exists
4. Network: Ensure API calls are reaching the server
