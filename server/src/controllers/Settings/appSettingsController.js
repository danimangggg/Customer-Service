const db = require('../../models');

// Get a setting by key
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const query = `
      SELECT setting_key, setting_value, description
      FROM app_settings
      WHERE setting_key = ?
    `;
    
    const [results] = await db.sequelize.query(query, {
      replacements: [key],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (!results) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    // Parse JSON if it's the youtube_playlist
    let value = results.setting_value;
    if (key === 'youtube_playlist' && value) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = [];
      }
    }
    
    res.json({
      success: true,
      key: results.setting_key,
      value: value,
      description: results.description
    });
    
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
};

// Update or create a setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    // Convert value to JSON string if it's an object/array
    let settingValue = value;
    if (typeof value === 'object') {
      settingValue = JSON.stringify(value);
    }
    
    const query = `
      INSERT INTO app_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        description = COALESCE(VALUES(description), description),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.sequelize.query(query, {
      replacements: [key, settingValue, description || null]
    });
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      key: key
    });
    
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
};

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const query = `
      SELECT setting_key, setting_value, description, updated_at
      FROM app_settings
      ORDER BY setting_key
    `;
    
    const results = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    // Parse JSON values
    const settings = results.map(setting => {
      let value = setting.setting_value;
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if not valid JSON
      }
      
      return {
        key: setting.setting_key,
        value: value,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });
    
    res.json({
      success: true,
      settings: settings
    });
    
  } catch (error) {
    console.error('Error fetching all settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

module.exports = {
  getSetting,
  updateSetting,
  getAllSettings
};
