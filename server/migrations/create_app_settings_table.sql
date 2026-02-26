-- Create app_settings table for storing application configuration
-- This table stores YouTube playlist and other app settings

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default YouTube playlist setting
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES ('youtube_playlist', '[]', 'YouTube videos playlist for TV entertainment')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
