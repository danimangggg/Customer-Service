import React, { useState, useEffect } from 'react';
import { MenuItem, TextField } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Reusable branch code dropdown.
 * Props: value, onChange, required, fullWidth, size, label, helperText
 */
const BranchSelect = ({ value, onChange, required = false, fullWidth = true, size = 'medium', label = 'Branch', helperText, sx }) => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/branches`)
      .then(res => setBranches(res.data.filter(b => b.status === 'Active')))
      .catch(() => {});
  }, []);

  return (
    <TextField
      select
      label={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      fullWidth={fullWidth}
      size={size}
      helperText={helperText}
      sx={sx}
    >
      <MenuItem value="">-- No Branch --</MenuItem>
      {branches.map(b => (
        <MenuItem key={b.id} value={b.branch_code}>
          {b.branch_name} ({b.branch_code})
        </MenuItem>
      ))}
    </TextField>
  );
};

export default BranchSelect;
