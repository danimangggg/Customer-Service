# Database Migrations

## YouTube Playlist Storage Migration

### Problem
The YouTube playlist was stored in browser's `localStorage`, which is tied to the specific domain/IP address. When accessing the application from a different IP, the playlist would be empty.

### Solution
Created a database table `app_settings` to store application settings including the YouTube playlist. This ensures the playlist persists regardless of which IP address is used to access the application.

### Migration Files

1. **create_app_settings_table.sql** - Creates the app_settings table
2. **run-migration.js** - Node.js script to execute the migration

### Running the Migration

```bash
cd server
node run-migration.js
```

### Database Schema

```sql
CREATE TABLE app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);
```

### API Endpoints

- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get a specific setting by key
- `PUT /api/settings/:key` - Update or create a setting

### Frontend Changes

The frontend now:
1. Loads YouTube playlist from the database on component mount
2. Automatically migrates existing localStorage data to database (one-time migration)
3. Saves playlist changes to the database instead of localStorage
4. Clears localStorage after successful migration

### Testing

Run the test script to verify the API is working:

```bash
cd server
node test-settings-api.js
```

### Benefits

✅ Playlist persists across different IP addresses
✅ Playlist is shared across all devices accessing the application
✅ Centralized storage for application settings
✅ Easy to backup and restore settings
✅ Can be extended to store other application configurations
