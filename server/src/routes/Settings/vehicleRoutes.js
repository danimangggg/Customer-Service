const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
} = require('../../controllers/Settings/vehicleController');

// Get all vehicles with pagination and filtering
router.get('/', getAllVehicles);

// Get vehicle statistics
router.get('/stats', getVehicleStats);

// Get vehicle by ID
router.get('/:id', getVehicleById);

// Create new vehicle
router.post('/', createVehicle);

// Update vehicle
router.put('/:id', updateVehicle);

// Delete vehicle
router.delete('/:id', deleteVehicle);

module.exports = router;