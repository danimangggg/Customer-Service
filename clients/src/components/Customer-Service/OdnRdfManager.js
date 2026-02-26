import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Add CSS for high z-index SweetAlert
const style = document.createElement('style');
style.innerHTML = `
  .swal-high-zindex {
    z-index: 10000 !important;
  }
`;
document.head.appendChild(style);

const OdnRdfManager = ({ open, onClose, processId, facilityName }) => {
  const [odns, setOdns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newOdn, setNewOdn] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editOdn, setEditOdn] = useState('');
  const [editStore, setEditStore] = useState('');
  const [stores, setStores] = useState([]);

  const userId = localStorage.getItem('EmployeeID');
  const userName = localStorage.getItem('FullName');

  useEffect(() => {
    if (open && processId) {
      fetchOdns();
    }
  }, [open, processId]);

  // Fetch stores from database
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${api_url}/api/stores`);
        const storeData = response.data.map(store => ({
          value: store.store_name,
          label: store.store_name
        }));
        setStores(storeData);
        
        // Set default selected store to first RDF store (AA11, AA12, AA3, AA4)
        const rdfStores = storeData.filter(s => 
          s.value.startsWith('AA') && s.value !== 'HP' && s.value !== 'CR'
        );
        if (rdfStores.length > 0 && !selectedStore) {
          setSelectedStore(rdfStores[0].value);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        // Fallback to default stores if fetch fails
        setStores([
          { value: 'AA11', label: 'AA11' },
          { value: 'AA12', label: 'AA12' },
          { value: 'AA3', label: 'AA3' },
          { value: 'AA4', label: 'AA4' }
        ]);
        if (!selectedStore) {
          setSelectedStore('AA11');
        }
      }
    };

    fetchStores();
  }, []);

  const fetchOdns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${api_url}/api/rdf-odns/${processId}`);
      if (response.data.success) {
        setOdns(response.data.odns);
      }
    } catch (error) {
      console.error('Error fetching ODNs:', error);
      Swal.fire('Error', 'Failed to fetch ODNs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOdn = async () => {
    if (!newOdn.trim()) {
      Swal.fire('Error', 'Please enter an ODN number', 'error');
      return;
    }

    try {
      const response = await axios.post(`${api_url}/api/rdf-odns`, {
        processId: processId,
        odnNumber: newOdn.trim(),
        store: selectedStore,
        addedById: userId,
        addedByName: userName
      });

      if (response.data.success) {
        setNewOdn('');
        // Keep the selected store for convenience
        fetchOdns();
        Swal.fire('Success', 'ODN added successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding ODN:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add ODN';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleEditOdn = (odn) => {
    setEditingId(odn.id);
    setEditOdn(odn.odn_number);
    setEditStore(odn.store);
  };

  const handleSaveEdit = async () => {
    if (!editOdn.trim()) {
      Swal.fire('Error', 'Please enter an ODN number', 'error');
      return;
    }

    try {
      const response = await axios.put(`${api_url}/api/rdf-odns/${editingId}`, {
        odnNumber: editOdn.trim(),
        store: editStore
      });

      if (response.data.success) {
        setEditingId(null);
        setEditOdn('');
        setEditStore('');
        fetchOdns();
        Swal.fire('Success', 'ODN updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating ODN:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update ODN';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditOdn('');
    setEditStore('');
  };

  const handleDeleteOdn = async (odnId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the ODN',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        container: 'swal-high-zindex'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${api_url}/api/rdf-odns/${odnId}`);
        if (response.data.success) {
          fetchOdns();
          Swal.fire({
            title: 'Deleted!',
            text: 'ODN has been deleted',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error deleting ODN:', error);
        Swal.fire('Error', 'Failed to delete ODN', 'error');
      }
    }
  };

  const getStoreColor = (store) => {
    // Dynamic color assignment based on store name
    const storeColors = {
      'AA11': 'primary',
      'AA12': 'secondary',
      'AA3': 'success',
      'AA4': 'warning',
      'HP': 'info',
      'CR': 'error'
    };
    return storeColors[store] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Manage ODNs - {facilityName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Process ID: {processId}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* Add New ODN Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New ODN
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="ODN Number"
              value={newOdn}
              onChange={(e) => setNewOdn(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              {stores.map((store) => (
                <MenuItem key={store.value} value={store.value}>
                  {store.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddOdn}
              disabled={loading}
            >
              Add
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ODNs List */}
        <Typography variant="subtitle1" gutterBottom>
          Current ODNs ({odns.length})
        </Typography>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography>Loading ODNs...</Typography>
          </Box>
        ) : odns.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No ODNs added yet. Click "Add" to create the first ODN.
            </Typography>
          </Box>
        ) : (
          <List>
            {odns.map((odn) => (
              <ListItem
                key={odn.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: 'background.paper'
                }}
              >
                {editingId === odn.id ? (
                  <Box sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        value={editOdn}
                        onChange={(e) => setEditOdn(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        select
                        value={editStore}
                        onChange={(e) => setEditStore(e.target.value)}
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        {stores.map((store) => (
                          <MenuItem key={store.value} value={store.value}>
                            {store.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        color="primary"
                        onClick={handleSaveEdit}
                        size="small"
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={handleCancelEdit}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="h6">{odn.odn_number}</Typography>
                          <Chip
                            label={odn.store}
                            color={getStoreColor(odn.store)}
                            size="small"
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Added by: {odn.added_by_name || 'Unknown'} • {new Date(odn.created_at).toLocaleString()}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditOdn(odn)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteOdn(odn.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OdnRdfManager;