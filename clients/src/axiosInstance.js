import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

// Attach branch_code, account_type, and store headers on every request
// Also guard: if token is gone (logged out from another tab), cancel the request and redirect
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Token gone — another tab logged out. Redirect and abort this request.
    window.location.href = '/';
    return Promise.reject(new axios.Cancel('Session ended'));
  }
  const branchCode = localStorage.getItem('branch_code');
  const accountType = localStorage.getItem('AccountType');
  const store = localStorage.getItem('store');
  if (branchCode) config.headers['X-Branch-Code'] = branchCode;
  if (accountType) config.headers['X-Account-Type'] = accountType;
  if (store) config.headers['X-Store'] = store;
  return config;
});

// Global connection state
let _setOffline = null;
export const registerOfflineHandler = (fn) => { _setOffline = fn; };

api.interceptors.response.use(
  (response) => {
    if (_setOffline) _setOffline(false);
    return response;
  },
  (error) => {
    // Network error or server completely unreachable (no response)
    if (!error.response && _setOffline) _setOffline(true);
    return Promise.reject(error);
  }
);

export default api;
