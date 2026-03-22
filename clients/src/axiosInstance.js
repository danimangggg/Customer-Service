import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

// Attach branch_code, account_type, and store headers on every request
api.interceptors.request.use((config) => {
  const branchCode = localStorage.getItem('branch_code');
  const accountType = localStorage.getItem('AccountType');
  const store = localStorage.getItem('store');
  if (branchCode) config.headers['X-Branch-Code'] = branchCode;
  if (accountType) config.headers['X-Account-Type'] = accountType;
  if (store) config.headers['X-Store'] = store;
  return config;
});

export default api;
