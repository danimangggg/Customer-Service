// src/index.js (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './disableErrorOverlay'; // Disable error overlay for TV display

// Red & White theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#c62828',       // deep red
      light: '#ef5350',
      dark: '#8e0000',
      contrastText: '#fff',
    },
    secondary: {
      main: '#e53935',       // bright red accent
      light: '#ff6f60',
      dark: '#ab000d',
      contrastText: '#fff',
    },
    background: {
      default: '#fafafa',    // near-white page background
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
    },
    warning: {
      main: '#ffc107',
      light: '#fff8e1',
    },
    error: {
      main: '#c62828',
      light: '#ffebee',
    },
    info: {
      main: '#e53935',
      light: '#ffebee',
    },
    grey: {
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontSize: '2.2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1a1a1a',
    },
    h5: {
      fontSize: '1.7rem',
      fontWeight: 600,
      color: '#2d2d2d',
    },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
        },
        containedPrimary: {
          boxShadow: '0 4px 8px rgba(198, 40, 40, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(198, 40, 40, 0.45)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.04em',
        },
        outlined: {
          borderColor: 'currentColor',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#fff',
          fontSize: '0.9rem',
          backgroundColor: '#c62828',  // red table headers
        },
        body: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: { color: '#fff !important' },
        icon: { color: '#fff !important' },
        active: { color: '#fff !important' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(198, 40, 40, 0.06) !important',
          },
        },
        head: { height: '60px' },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);