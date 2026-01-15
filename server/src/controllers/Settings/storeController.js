const db = require('../../models');
const Store = db.store;

// Get all stores
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      order: [['store_name', 'ASC']]
    });
    res.status(200).json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ message: 'Failed to fetch stores', error: error.message });
  }
};

// Create a new store
const createStore = async (req, res) => {
  try {
    const { store_name, description } = req.body;

    // Check if store name already exists
    const existing = await Store.findOne({ where: { store_name } });
    if (existing) {
      return res.status(400).json({ message: 'Store name already exists' });
    }

    const store = await Store.create({
      store_name,
      description
    });

    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ message: 'Failed to create store', error: error.message });
  }
};

// Update a store
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_name, description } = req.body;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if new store name conflicts with another store
    if (store_name !== store.store_name) {
      const existing = await Store.findOne({ where: { store_name } });
      if (existing) {
        return res.status(400).json({ message: 'Store name already exists' });
      }
    }

    await store.update({
      store_name,
      description
    });

    res.status(200).json(store);
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
};

// Delete a store
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    await store.destroy();
    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ message: 'Failed to delete store', error: error.message });
  }
};

module.exports = {
  getAllStores,
  createStore,
  updateStore,
  deleteStore
};
