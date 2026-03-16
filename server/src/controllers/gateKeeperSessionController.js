const db = require('../models');

// Create a new Gate Keeper session (login with store selection)
const createSession = async (req, res) => {
  try {
    const { user_id, stores } = req.body;

    if (!user_id || !stores || !Array.isArray(stores) || stores.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'user_id and stores array are required'
      });
    }

    // Deactivate any existing active sessions for this user
    await db.GateKeeperSession.update(
      { 
        is_active: false,
        logged_out_at: new Date()
      },
      { 
        where: { 
          user_id,
          is_active: true
        }
      }
    );

    // Create new sessions for each selected store
    const sessions = await Promise.all(
      stores.map(store => 
        db.GateKeeperSession.create({
          user_id,
          store,
          logged_in_at: new Date(),
          is_active: true
        })
      )
    );

    res.json({
      success: true,
      message: `Gate Keeper session created for ${stores.length} store(s)`,
      sessions
    });
  } catch (error) {
    console.error('Error creating Gate Keeper session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      details: error.message
    });
  }
};

// Get active sessions for a user
const getActiveSessions = async (req, res) => {
  try {
    const { user_id } = req.params;

    const sessions = await db.GateKeeperSession.findAll({
      where: {
        user_id,
        is_active: true
      },
      order: [['logged_in_at', 'DESC']]
    });

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
      details: error.message
    });
  }
};

// Get all active Gate Keepers by store
const getActiveGateKeepersByStore = async (req, res) => {
  try {
    const { store } = req.params;

    console.log('=== GET GATE KEEPERS BY STORE ===');
    console.log('Store:', store);

    const sessions = await db.GateKeeperSession.findAll({
      where: {
        store,
        is_active: true
      },
      include: [{
        model: db.employee,
        as: 'employee',
        attributes: ['id', 'user_name', 'full_name', 'jobTitle'],
        required: false // Allow sessions without employees (for debugging)
      }],
      order: [['logged_in_at', 'DESC']]
    });

    console.log('Found sessions:', sessions.length);
    
    // Log each session to see what's in it
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        id: session.id,
        user_id: session.user_id,
        store: session.store,
        has_employee: !!session.employee,
        employee_data: session.employee ? {
          id: session.employee.id,
          full_name: session.employee.full_name,
          jobTitle: session.employee.jobTitle
        } : null
      });
    });

    // Filter out sessions without employees and format response
    const gateKeepers = sessions
      .filter(session => session.employee !== null)
      .map(session => ({
        id: session.employee.id,
        name: session.employee.full_name,
        label: session.employee.full_name,
        store: session.store,
        logged_in_at: session.logged_in_at
      }));

    console.log('Formatted gate keepers:', gateKeepers.length);

    if (gateKeepers.length === 0) {
      console.warn('⚠️ No valid Gate Keepers found. Sessions exist but employees not found in employees table.');
    }

    res.json({
      success: true,
      gateKeepers
    });
  } catch (error) {
    console.error('❌ Error fetching Gate Keepers by store:', error);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Gate Keepers',
      details: error.message
    });
  }
};

// Deactivate sessions (logout)
const deactivateSessions = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    await db.GateKeeperSession.update(
      { 
        is_active: false,
        logged_out_at: new Date()
      },
      { 
        where: { 
          user_id,
          is_active: true
        }
      }
    );

    res.json({
      success: true,
      message: 'Gate Keeper sessions deactivated'
    });
  } catch (error) {
    console.error('Error deactivating sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate sessions',
      details: error.message
    });
  }
};

module.exports = {
  createSession,
  getActiveSessions,
  getActiveGateKeepersByStore,
  deactivateSessions
};
