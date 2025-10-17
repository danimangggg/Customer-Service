// src/index.js (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define a more vibrant Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      // A more vibrant, energetic blue or even a bold teal/purple
      // Example: A brighter, more saturated blue:
      main: '#2196f3', // Original was '#1976d2'
      light: '#6ec6ff',
      dark: '#0069c0',
      contrastText: '#fff',
    },
    secondary: {
      // A strong, complementary color
      // Example: A punchy orange or magenta
      main: '#ff5722', // Original was '#dc004e' (deep red) - this is a vibrant orange
      light: '#ff8a50',
      dark: '#c41c00',
      contrastText: '#fff',
    },
    background: {
      // Keep a clean background but slightly brighter if possible, or subtly textured if desired
      default: '#e0f2f7', // A very light, cool background for vibrancy
      paper: '#ffffff', // White for cards/tables - keep it clean
    },
    success: {
      main: '#4caf50', // Keep green for success, it's generally good
      light: '#e8f5e9',
    },
    warning: {
      main: '#ffc107', // Brighter yellow/orange for warning
      light: '#fff8e1',
    },
    error: {
      main: '#f44336', // Keep red for error
      light: '#ffebee',
    },
    info: { // Good for general info chips
        main: '#03a9f4',
        light: '#e0f7fa',
    },
    grey: {
      100: '#f5f5f5', // Still good for subtle header background
      200: '#eeeeee',
      300: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontSize: '2.2rem', // Slightly larger
      fontWeight: 700, // Bolder
      letterSpacing: '-0.02em', // A bit tighter for energy
      color: '#303030', // A strong dark grey
    },
    h5: {
      fontSize: '1.7rem',
      fontWeight: 600,
      color: '#424242',
    },
    body1: {
        fontSize: '1rem', // Standard body text
    },
    body2: {
        fontSize: '0.875rem', // Smaller text for secondary info
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Keep initial caps for buttons
          fontWeight: 600,
          borderRadius: '8px', // Slightly more rounded buttons
        },
        containedPrimary: {
            boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)', // Stronger shadow for primary button
            '&:hover': {
                boxShadow: '0 6px 12px rgba(33, 150, 243, 0.4)', // Even stronger on hover
            }
        }
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '12px', // More rounded cards/tables
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)', // A softer, more spread-out shadow
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                fontWeight: 600, // Make chip text bolder
                textTransform: 'uppercase', // Uppercase for a more "tag" like feel
                letterSpacing: '0.05em', // A bit of letter spacing
            },
            outlined: {
                // Adjust colors for outlined chips for vibrancy
                borderColor: 'currentColor', // Use the chip's color
            }
        }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700, // Header cells bolder
          color: '#505050', // Stronger header text color
          fontSize: '0.9rem', // Slightly larger header text
          backgroundColor: '#e3f2fd', // A light, vibrant background for table head
        },
        body: {
          fontSize: '0.875rem', // Body cells font size
        },
      },
    },
    MuiTableSortLabel: {
        styleOverrides: {
            icon: {
                color: 'inherit !important', // Ensure icon color inherits from cell text
            },
        },
    },
    MuiTableRow: {
        styleOverrides: {
            root: {
                '&.MuiTableRow-hover:hover': { // Ensure hover effect is always strong
                    backgroundColor: 'rgba(0, 0, 0, 0.04) !important', // A more noticeable hover
                },
            },
            head: {
                height: '60px', // Taller header rows
            }
        }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);