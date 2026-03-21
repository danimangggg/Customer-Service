import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Tooltip,
  Avatar,
  Chip,
  Stack,
  Collapse
} from '@mui/material';
import {
  Assignment,
  AccountCircle,
  AddCircleOutline,
  VpnKey,
  ExitToApp,
  Group,
  Task,
  FormatListBulleted,
  LocalHospital,
  Dashboard,
  Assessment,
  Inventory,
  BarChart,
  PieChart,
  ShowChart,
  TrendingUp,
  Analytics,
  Settings,
  Business,
  Tv,
  DirectionsCar,
  ManageAccounts,
  LocalShipping,
  Route,
  Description,
  Store,
  ExpandLess,
  ExpandMore,
  Receipt,
  Security,
  Print,
  AccountTree
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = () => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tmSettingsOpen, setTmSettingsOpen] = useState(false);
  const [tmReportsOpen, setTmReportsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [mgmtReportsOpen, setMgmtReportsOpen] = useState(false);
  const [mgmtProfileOpen, setMgmtProfileOpen] = useState(false);

  const signOut = async () => {
    const jobTitle = localStorage.getItem('JobTitle');
    const userId = localStorage.getItem('UserId') || localStorage.getItem('EmployeeID');
    
    // If Gate Keeper, deactivate their sessions
    if (jobTitle === 'Gate Keeper' && userId) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
        await axios.post(`${API_URL}/api/gate-keeper-sessions/logout`, {
          user_id: userId
        });
        console.log('✅ Gate Keeper sessions deactivated');
      } catch (error) {
        console.error('❌ Error deactivating Gate Keeper sessions:', error);
        // Continue with logout even if this fails
      }
    }
    
    localStorage.clear();
    window.location.href = '/';
  };

  const rawAccountType = localStorage.getItem("AccountType") || "";
  const token = localStorage.getItem("token");
  const fullName = localStorage.getItem("FullName") || 'Guest';
  const accountType = rawAccountType;
  const jobTitle = localStorage.getItem("JobTitle");

  console.log('Navbar Debug:', { accountType, jobTitle, rawAccountType });

  const branchCode = localStorage.getItem("branch_code");
  const branchName = localStorage.getItem("branch_name");

  const isAdmin = accountType === "Admin";
  const isSuperAdmin = accountType === "Super Admin";
  const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
  const isFinance = accountType === "Finance";

  // Helper function to check if current path matches the menu item
  const isActivePath = (path) => location.pathname === path;

  // Helper function to get active menu item styles
  const getActiveStyles = (path) => ({
    borderRadius: 2,
    mx: 1,
    mb: 1,
    bgcolor: isActivePath(path) ? 'rgba(21, 101, 192, 0.12)' : 'transparent',
    borderLeft: isActivePath(path) ? 4 : 0,
    borderColor: isActivePath(path) ? '#1565c0' : 'transparent',
    '&:hover': {
      bgcolor: 'rgba(21, 101, 192, 0.08)',
      transform: 'translateX(4px)',
      transition: 'all 0.2s ease'
    },
    transition: 'all 0.2s ease'
  });

  const MenuTooltip = ({ title, children }) => (
    <Tooltip title={title} placement="right" enterDelay={300}>
      {children}
    </Tooltip>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            background: '#ffffff',
            color: '#1a1a1a',
            overflowX: 'hidden',
            position: 'fixed',
            height: '100vh',
            boxShadow: '4px 0 20px rgba(21,101,192,0.12)',
            borderRight: '2px solid #1565c0',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f5f5f5',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(21,101,192,0.3)',
              borderRadius: '3px',
            },
            // Global text wrapping for all menu items
            '& .MuiListItemText-root': {
              margin: 0,
              '& .MuiListItemText-primary': {
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                color: '#1a1a1a',
              }
            }
          },
        }}
      >
        {/* Enhanced Header */}
        <Box sx={{ 
          bgcolor: '#1565c0',
          px: 2,
          py: 0.5,
          borderBottom: '1px solid rgba(21,101,192,0.3)'
        }}>
          <Stack direction="column" alignItems="center" spacing={-2}>
            <Box
              component="img"
              src="/pharmalog-logo.png"
              alt="EPSS-MT Logo"
              sx={{ 
                width: 150, 
                height: 150,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ 
                fontSize: '0.95rem',
                lineHeight: 1.2,
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                color: 'white'
              }}>
                EPSS Monitoring Tool
              </Typography>
            </Box>
          </Stack>
        </Box>

       <List sx={{ pt: 2, px: 1 }}>
         {/* DASHBOARDS SECTION - AT THE TOP */}
         {(jobTitle === "Manager" || jobTitle === "Coordinator" || accountType === "Admin") && (
           <MenuTooltip title={"Dashboard"}>
             <ListItem button component={Link} to="/manager-dashboard"
               sx={getActiveStyles('/manager-dashboard')}>
               <ListItemIcon><Dashboard sx={{ color: '#e91e63' }} /></ListItemIcon>
               <ListItemText primary={"Dashboard"}
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/manager-dashboard') ? 600 : 500, fontSize: '1.05rem' } }} />
             </ListItem>
           </MenuTooltip>
         )}

         {/* MAIN NAVIGATION ITEMS */}

         {/* Outstanding Process - for O2C Officer - HP (goes to hp-facilities) */}
         {jobTitle === "O2C Officer - HP" && (
           <MenuTooltip title={"Outstanding Process"}>
             <ListItem 
               button 
               component={Link} 
               to="/hp-facilities"
               sx={getActiveStyles('/hp-facilities')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/hp-facilities') ? 600 : 500, fontSize: '0.95rem' } }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Outstanding - for EWM Officer - HP (combined Outstanding + Goods Issue) */}
         {jobTitle === "EWM Officer - HP" && (
           <MenuTooltip title={"Outstanding"}>
             <ListItem 
               button 
               component={Link} 
               to="/ewm-outstanding"
               sx={getActiveStyles('/ewm-outstanding')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding"} 
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/ewm-outstanding') ? 600 : 500, fontSize: '0.95rem' } }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Goods Issue - for EWM Officer - HP */}
         {jobTitle === "EWM Officer - HP" && (
           <MenuTooltip title={"Goods Issue"}>
             <ListItem 
               button 
               component={Link} 
               to="/ewm-goods-issue"
               sx={getActiveStyles('/ewm-goods-issue')}
             >
               <ListItemIcon>
                 <Inventory sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Goods Issue"} 
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/ewm-goods-issue') ? 600 : 500, fontSize: '0.95rem' } }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Outstanding Process (Cash & Credit) - for O2C Officers and EWM Officers */}
         {(jobTitle === "O2C Officer" || jobTitle === "EWM Officer") && (
           <MenuTooltip title={"Outstanding Process"}>
             <ListItem 
               button 
               component={Link} 
               to="/outstandingProcess"
               sx={getActiveStyles('/outstandingProcess')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#e53935' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/outstandingProcess') ? 600 : 500,
                     fontSize: '0.95rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Finance Invoices - for Cashier/Finance */}
         {(jobTitle === "Cashier" || jobTitle === "Finance") && (
           <MenuTooltip title={"Invoice Records"}>
             <ListItem
               button
               component={Link}
               to="/finance-invoices"
               sx={getActiveStyles('/finance-invoices')}
             >
               <ListItemIcon>
                 <Receipt sx={{ color: '#1565c0' }} />
               </ListItemIcon>
               <ListItemText
                 primary={"Invoice Records"}
                 sx={{
                   '& .MuiListItemText-primary': {
                     fontWeight: isActivePath('/finance-invoices') ? 600 : 500,
                     fontSize: '0.95rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   }
                 }}
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Register Customer - for Customer Service Officers only */}
         {jobTitle === "Customer Service Officer" && (
           <MenuTooltip title={"Register Customer"}>
             <ListItem 
               button 
               component={Link} 
               to="/register-customer"
               sx={getActiveStyles('/register-customer')}
             >
               <ListItemIcon>
                 <AddCircleOutline sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Register Customer"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/register-customer') ? 600 : 500,
                     fontSize: '0.95rem',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Customer Availability - for Queue Manager only */}
         {jobTitle === "Queue Manager" && (
           <MenuTooltip title={"Customer Availability"}>
             <ListItem 
               button 
               component={Link} 
               to="/queue-manager"
               sx={getActiveStyles('/queue-manager')}
             >
               <ListItemIcon>
                 <Store sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Customer Availability"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/queue-manager') ? 600 : 500,
                     fontSize: '0.95rem',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Outstanding Process (PI Vehicle Requests) - for PI Officer HP */}
         {jobTitle === "PI Officer-HP" && (
           <MenuTooltip title={"Outstanding Process"}>
             <ListItem 
               button 
               component={Link} 
               to="/pi-vehicle-requests"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#e53935' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Dispatch Management - for Dispatcher HP */}
         {jobTitle === "Dispatcher - HP" && (
           <MenuTooltip title={"Dispatch Management"}>
             <ListItem 
               button 
               component={Link} 
               to="/dispatch-management"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <LocalShipping sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Dispatch Management"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* HP Documentation - for Documentation Officer - HP */}
         {jobTitle === "Documentation Officer - HP" && (
           <MenuTooltip title={"HP Documentation"}>
             <ListItem 
               button 
               component={Link} 
               to="/documentation-hp"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Description sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"HP Documentation"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Quality Evaluation - for Quality Evaluator */}
         {jobTitle === "Quality Evaluator" && (
           <MenuTooltip title={"Quality Evaluation"}>
             <ListItem 
               button 
               component={Link} 
               to="/quality-evaluation"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Quality Evaluation"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Outstanding Process (Dispatch) - for Dispatchers */}
         {jobTitle === "Dispatcher" && (
           <MenuTooltip title={"Outstanding Process"}>
             <ListItem 
               button 
               component={Link} 
               to="/dispatch"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#e53935' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Exit Permit - for Dispatch-Documentation */}
         {jobTitle === "Dispatch-Documentation" && (
           <MenuTooltip title={"Exit Permit"}>
             <ListItem 
               button 
               component={Link} 
               to="/exit-permit"
               sx={getActiveStyles('/exit-permit')}
             >
               <ListItemIcon>
                 <Receipt sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Exit Permit"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/exit-permit') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Gate Security - for Security */}
         {jobTitle === "Gate Keeper" && (
           <MenuTooltip title={"Security"}>
             <ListItem 
               button 
               component={Link} 
               to="/gate-keeper"
               sx={getActiveStyles('/gate-keeper')}
             >
               <ListItemIcon>
                 <Security sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Security"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/gate-keeper') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Picklists - for WIM Operator only */}
         {jobTitle === "WIM Operator" && (
           <MenuTooltip title={"Picklists"}>
             <ListItem 
               button 
               component={Link} 
               to="/all-picklists"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Inventory sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Picklists"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* EWM Documentation - for EWM-Documentation only */}
         {jobTitle === "EWM-Documentation" && (
           <MenuTooltip title={"EWM Documentation"}>
             <ListItem 
               button 
               component={Link} 
               to="/ewm-documentation"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Description sx={{ color: '#e53935' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Invoice Management"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* TV Main Menu - for TV Operator only */}
         {jobTitle === "TV Operator" && (
           <MenuTooltip title={"TV"}>
             <ListItem 
               button 
               component={Link} 
               to="/tv-main-menu"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(198, 40, 40, 0.08)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Tv sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"TV"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Settings Menu - Admin and Super Admin */}
         {isAdminOrSuperAdmin && (
           <>
             <MenuTooltip title={"Settings"}>
               <ListItem 
                 button 
                 onClick={() => setSettingsOpen(!settingsOpen)}
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 1,
                   bgcolor: settingsOpen ? 'rgba(198, 40, 40, 0.12)' : 'transparent',
                   '&:hover': {
                     bgcolor: 'rgba(198, 40, 40, 0.08)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <Settings sx={{ color: '#607d8b' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Settings"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: settingsOpen ? 600 : 500,
                       fontSize: '0.95rem'
                     } 
                   }} 
                 />
                 {settingsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             
             <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 {/* Organization Profile - Admin only */}
                 {isAdmin && (
                 <MenuTooltip title={"Organization Profile"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/settings/organization-profile"
                     sx={{
                       ...getActiveStyles('/settings/organization-profile'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <Business sx={{ color: '#795548' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Organization Profile"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/organization-profile') ? 600 : 500,
                           fontSize: '0.95rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>
                 )}

                 {/* Store Management - Admin only */}
                 {isAdmin && (
                 <MenuTooltip title={"Store Management"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/settings/store-management"
                     sx={{
                       ...getActiveStyles('/settings/store-management'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <Store sx={{ color: '#c62828' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Store Management"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/store-management') ? 600 : 500,
                           fontSize: '0.95rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>
                 )}

                 {/* EPSS Branches - Super Admin only */}
                 {isSuperAdmin && (
                 <MenuTooltip title={"EPSS Branches"}>
                   <ListItem
                     button
                     component={Link}
                     to="/settings/branches"
                     sx={{
                       ...getActiveStyles('/settings/branches'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <AccountTree sx={{ color: '#c62828' }} />
                     </ListItemIcon>
                     <ListItemText
                       primary={"EPSS Branches"}
                       sx={{
                         '& .MuiListItemText-primary': {
                           fontWeight: isActivePath('/settings/branches') ? 600 : 500,
                           fontSize: '0.95rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         }
                       }}
                     />
                   </ListItem>
                 </MenuTooltip>
                 )}

                 {/* User Management */}
                 <MenuTooltip title={"User Management"}>
                   <ListItem 
                     button 
                     component={Link}                      to="/settings/user-management"
                     sx={{
                       ...getActiveStyles('/settings/user-management'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <ManageAccounts sx={{ color: '#c62828' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"User Management"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/user-management') ? 600 : 500,
                           fontSize: '0.95rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>

                 {/* Account Types & Roles */}
                 <MenuTooltip title={"Account Types & Roles"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/settings/account-types"
                     sx={{
                       ...getActiveStyles('/settings/account-types'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <Group sx={{ color: '#c62828' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Account Types & Roles"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/account-types') ? 600 : 500,
                           fontSize: '0.95rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>

                 {/* Reset Password */}
                 <MenuTooltip title={"Reset Password"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/reset-password"
                     sx={{
                       ...getActiveStyles('/reset-password'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <VpnKey sx={{ color: '#e53935' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Reset Password"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/reset-password') ? 600 : 500,
                           fontSize: '0.95rem'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}





         {/* Vehicle Log Sheet - Driver, General Service only */}
         {(jobTitle === 'Driver' || jobTitle === 'General Service') && (
           <MenuTooltip title={"Vehicle Log Sheet"}>
             <ListItem button component={Link} to="/transportation/vehicle-log-sheet"
               sx={{ borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/vehicle-log-sheet') }}>
               <ListItemIcon><DirectionsCar sx={{ color: '#1565c0' }} /></ListItemIcon>
               <ListItemText primary={"Vehicle Log Sheet"}
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/vehicle-log-sheet') ? 600 : 500, fontSize: '0.95rem' } }} />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Fuel Log Book - Driver and General Service */}
         {(jobTitle === 'Driver' || jobTitle === 'General Service') && (
           <MenuTooltip title={"Fuel Log Book"}>
             <ListItem button component={Link} to="/transportation/fuel-log-book"
               sx={{ borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/fuel-log-book') }}>
               <ListItemIcon><DirectionsCar sx={{ color: '#16a34a' }} /></ListItemIcon>
               <ListItemText primary={"Fuel Log Book"}
                 sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/fuel-log-book') ? 600 : 500, fontSize: '0.95rem' } }} />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Outstanding - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <MenuTooltip title={"Outstanding"}>
             <ListItem 
               button 
               component={Link} 
               to="/tm-manager"
               sx={getActiveStyles('/tm-manager')}
             >
               <ListItemIcon>
                 <LocalShipping sx={{ color: '#e53935' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/tm-manager') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Settings (Routes, Vehicles, HP Facilities) - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <>
             <MenuTooltip title={"Settings"}>
               <ListItem
                 button
                 onClick={() => setTmSettingsOpen(!tmSettingsOpen)}
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 1,
                   bgcolor: tmSettingsOpen ? 'rgba(198, 40, 40, 0.12)' : 'transparent',
                   '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.08)' }
                 }}
               >
                 <ListItemIcon>
                   <Settings sx={{ color: '#607d8b' }} />
                 </ListItemIcon>
                 <ListItemText
                   primary={"Settings"}
                   sx={{ '& .MuiListItemText-primary': { fontWeight: tmSettingsOpen ? 600 : 500, fontSize: '0.95rem' } }}
                 />
                 {tmSettingsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>

             <Collapse in={tmSettingsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>

                 <MenuTooltip title={"Routes"}>
                   <ListItem button component={Link} to="/transportation/routes"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/routes') }}>
                     <ListItemIcon><Route sx={{ color: '#c62828' }} /></ListItemIcon>
                     <ListItemText primary={"Routes"}
                       sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/routes') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>

                 <MenuTooltip title={"Vehicles"}>
                   <ListItem button component={Link} to="/transportation/vehicle-management"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/vehicle-management') }}>
                     <ListItemIcon><DirectionsCar sx={{ color: '#e53935' }} /></ListItemIcon>
                     <ListItemText primary={"Vehicles"}
                       sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/vehicle-management') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>

                 <MenuTooltip title={"HP Facilities"}>
                   <ListItem button component={Link} to="/transportation/hp-facilities"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/hp-facilities') }}>
                     <ListItemIcon><LocalHospital sx={{ color: '#c62828' }} /></ListItemIcon>
                     <ListItemText primary={"HP Facilities"}
                       sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/hp-facilities') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>

               </List>
             </Collapse>

             {/* Reports submenu for TM Manager */}
             <MenuTooltip title={"Reports"}>
               <ListItem button onClick={() => setTmReportsOpen(!tmReportsOpen)}
                 sx={{ borderRadius: 2, mx: 1, mb: 1, bgcolor: tmReportsOpen ? 'rgba(198,40,40,0.12)' : 'transparent', '&:hover': { bgcolor: 'rgba(198,40,40,0.08)' } }}>
                 <ListItemIcon><BarChart sx={{ color: '#607d8b' }} /></ListItemIcon>
                 <ListItemText primary={"Reports"} sx={{ '& .MuiListItemText-primary': { fontWeight: tmReportsOpen ? 600 : 500, fontSize: '0.95rem' } }} />
                 {tmReportsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             <Collapse in={tmReportsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 <MenuTooltip title={"HP Report"}>
                   <ListItem button component={Link} to="/reports/hp-comprehensive"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/reports/hp-comprehensive') }}>
                     <ListItemIcon><LocalHospital sx={{ color: '#c62828', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"HP Report"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"RDF Report"}>
                   <ListItem button component={Link} to="/reports/rdf"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/reports/rdf') }}>
                     <ListItemIcon><BarChart sx={{ color: '#c62828', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"RDF Report"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/rdf') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"Vehicle Log Sheet"}>
                   <ListItem button component={Link} to="/transportation/vehicle-log-sheet"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/vehicle-log-sheet') }}>
                     <ListItemIcon><DirectionsCar sx={{ color: '#1565c0', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Vehicle Log Sheet"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/vehicle-log-sheet') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"Fuel Log Book"}>
                   <ListItem button component={Link} to="/transportation/fuel-log-book"
                     sx={{ pl: 4, borderRadius: 2, mx: 1, mb: 0.5, ...getActiveStyles('/transportation/fuel-log-book') }}>
                     <ListItemIcon><DirectionsCar sx={{ color: '#16a34a', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Fuel Log Book"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/fuel-log-book') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}





         {/* Biller - for Biller only */}
         {jobTitle === "Biller" && (
           <MenuTooltip title={"Biller"}>
             <ListItem 
               button 
               component={Link} 
               to="/biller"
               sx={getActiveStyles('/biller')}
             >
               <ListItemIcon>
                 <Print sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Biller"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/biller') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}



         {/* Reports - for Admin and Super Admin (collapsible) */}
         {isAdminOrSuperAdmin && (
           <>
             <MenuTooltip title={"Reports"}>
               <ListItem 
                 button 
                 onClick={() => setReportsOpen(!reportsOpen)}
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 1,
                   bgcolor: reportsOpen ? 'rgba(198, 40, 40, 0.12)' : 'transparent',
                   '&:hover': {
                     bgcolor: 'rgba(198, 40, 40, 0.08)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <BarChart sx={{ color: '#e91e63' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Reports"} 
                   sx={{ '& .MuiListItemText-primary': { fontWeight: reportsOpen ? 600 : 500, fontSize: '0.95rem' } }} 
                 />
                 {reportsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 <MenuTooltip title={"HP Report"}>
                   <ListItem button component={Link} to="/reports/hp-comprehensive"
                     sx={{ ...getActiveStyles('/reports/hp-comprehensive'), pl: 4, ml: 2, mr: 1 }}>
                     <ListItemIcon><BarChart sx={{ color: '#c62828' }} /></ListItemIcon>
                     <ListItemText primary={"HP Report"}
                       sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"RDF Report"}>
                   <ListItem button component={Link} to="/reports/rdf"
                     sx={{ ...getActiveStyles('/reports/rdf'), pl: 4, ml: 2, mr: 1 }}>
                     <ListItemIcon><BarChart sx={{ color: '#c62828' }} /></ListItemIcon>
                     <ListItemText primary={"RDF Report"}
                       sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/rdf') ? 600 : 500, fontSize: '0.95rem' } }} />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}

         {/* Reports submenu - Manager and Coordinator */}
         {(jobTitle === "Manager" || jobTitle === "Coordinator") && (
           <>
             <MenuTooltip title={"Reports"}>
               <ListItem button onClick={() => setMgmtReportsOpen(!mgmtReportsOpen)}
                 sx={{ borderRadius: 2, mx: 1, mb: 1, bgcolor: mgmtReportsOpen ? 'rgba(21,101,192,0.12)' : 'transparent', '&:hover': { bgcolor: 'rgba(21,101,192,0.08)' } }}>
                 <ListItemIcon><BarChart sx={{ color: '#1565c0' }} /></ListItemIcon>
                 <ListItemText primary={"Reports"} sx={{ '& .MuiListItemText-primary': { fontWeight: mgmtReportsOpen ? 600 : 500, fontSize: '0.95rem' } }} />
                 {mgmtReportsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             <Collapse in={mgmtReportsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 <MenuTooltip title={"HP Report"}>
                   <ListItem button component={Link} to="/reports/hp-comprehensive"
                     sx={{ pl: 4, ...getActiveStyles('/reports/hp-comprehensive') }}>
                     <ListItemIcon><BarChart sx={{ color: '#c62828', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"HP Report"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"RDF Report"}>
                   <ListItem button component={Link} to="/reports/rdf"
                     sx={{ pl: 4, ...getActiveStyles('/reports/rdf') }}>
                     <ListItemIcon><BarChart sx={{ color: '#c62828', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"RDF Report"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/rdf') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"Vehicle Log Sheet"}>
                   <ListItem button component={Link} to="/transportation/vehicle-log-sheet"
                     sx={{ pl: 4, ...getActiveStyles('/transportation/vehicle-log-sheet') }}>
                     <ListItemIcon><DirectionsCar sx={{ color: '#1565c0', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Vehicle Log Sheet"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/vehicle-log-sheet') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"Fuel Log Book"}>
                   <ListItem button component={Link} to="/transportation/fuel-log-book"
                     sx={{ pl: 4, ...getActiveStyles('/transportation/fuel-log-book') }}>
                     <ListItemIcon><DirectionsCar sx={{ color: '#16a34a', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Fuel Log Book"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/transportation/fuel-log-book') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}

         {/* Profile submenu - Manager and Coordinator */}
         {(jobTitle === "Manager" || jobTitle === "Coordinator") && (
           <>
             <MenuTooltip title={"Profile"}>
               <ListItem button onClick={() => setMgmtProfileOpen(!mgmtProfileOpen)}
                 sx={{ borderRadius: 2, mx: 1, mb: 1, bgcolor: mgmtProfileOpen ? 'rgba(21,101,192,0.12)' : 'transparent', '&:hover': { bgcolor: 'rgba(21,101,192,0.08)' } }}>
                 <ListItemIcon><Business sx={{ color: '#1565c0' }} /></ListItemIcon>
                 <ListItemText primary={"Profile"} sx={{ '& .MuiListItemText-primary': { fontWeight: mgmtProfileOpen ? 600 : 500, fontSize: '0.95rem' } }} />
                 {mgmtProfileOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             <Collapse in={mgmtProfileOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 <MenuTooltip title={"Organization Profile"}>
                   <ListItem button component={Link} to="/reports/organization-profile"
                     sx={{ pl: 4, ...getActiveStyles('/reports/organization-profile') }}>
                     <ListItemIcon><Business sx={{ color: '#1565c0', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Organization Profile"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/reports/organization-profile') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
                 <MenuTooltip title={"Users"}>
                   <ListItem button component={Link} to="/settings/user-management"
                     sx={{ pl: 4, ...getActiveStyles('/settings/user-management') }}>
                     <ListItemIcon><Group sx={{ color: '#1565c0', fontSize: 20 }} /></ListItemIcon>
                     <ListItemText primary={"Users"} sx={{ '& .MuiListItemText-primary': { fontWeight: isActivePath('/settings/user-management') ? 600 : 500, fontSize: '0.9rem' } }} />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}

         {/* HP Report - for HP users only */}
         {!isAdminOrSuperAdmin && jobTitle !== "Coordinator" && jobTitle !== "Manager" && (jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP" || jobTitle === "PI Officer-HP" || jobTitle === "Documentation Officer - HP" || jobTitle === "Quality Evaluator" || jobTitle === "Dispatcher - HP" || jobTitle === "TM Manager" || jobTitle === "Biller") && (
           <MenuTooltip title={"HP Report"}>
             <ListItem 
               button 
               component={Link} 
               to="/reports/hp-comprehensive"
               sx={getActiveStyles('/reports/hp-comprehensive')}
             >
               <ListItemIcon>
                 <BarChart sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"HP Report"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* RDF Report - for RDF users (non-HP users) */}
         {!isAdminOrSuperAdmin && jobTitle !== "Coordinator" && jobTitle !== "Manager" && jobTitle !== "O2C Officer - HP" && jobTitle !== "EWM Officer - HP" && jobTitle !== "PI Officer-HP" && jobTitle !== "Documentation Officer - HP" && jobTitle !== "Quality Evaluator" && jobTitle !== "Dispatcher - HP" && jobTitle !== "TM Manager" && jobTitle !== "Biller" && jobTitle && (
           <MenuTooltip title={"RDF Report"}>
             <ListItem 
               button 
               component={Link} 
               to="/reports/rdf"
               sx={getActiveStyles('/reports/rdf')}
             >
               <ListItemIcon>
                 <BarChart sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"RDF Report"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/reports/rdf') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Organization Profile - for Customer Service Officers */}
         {jobTitle === "Customer Service Officer" && (
           <MenuTooltip title={"Organization Profile"}>
             <ListItem 
               button 
               component={Link} 
               to="/settings/organization-profile"
               sx={getActiveStyles('/settings/organization-profile')}
             >
               <ListItemIcon>
                 <Business sx={{ color: '#795548' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Organization Profile"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/settings/organization-profile') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* TV Main Menu - for Admin, Super Admin, Manager, and Coordinator */}
         {(isAdminOrSuperAdmin || jobTitle === "Manager" || jobTitle === "Coordinator") && (
           <MenuTooltip title={"TV"}>
             <ListItem 
               button 
               component={Link} 
               to="/tv-main-menu"
               sx={getActiveStyles('/tv-main-menu')}
             >
               <ListItemIcon>
                 <Tv sx={{ color: '#c62828' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"TV"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/tv-main-menu') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

        </List>

        <Divider sx={{ my: 2, bgcolor: 'rgba(198,40,40,0.15)' }} />

        {/* User Info Section - Bottom */}
        <Box sx={{ mt: 'auto', px: 2, py: 2, bgcolor: 'rgba(198,40,40,0.06)', borderRadius: 2, mx: 1, mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#c62828' }}>
              <AccountCircle />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="600" noWrap sx={{ fontSize: '0.9rem', mb: 0.5, color: '#1a1a1a' }}>
                {fullName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem', color: '#1a1a1a' }}>
                {jobTitle || accountType || 'User'}
              </Typography>
              {!isSuperAdmin && branchName && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={branchName}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(198,40,40,0.12)', color: '#c62828', fontWeight: 600 }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        <List sx={{ px: 1 }}>
          {/* Change Password - All logged in users */}
          {token !== "guest" && (
            <MenuTooltip title={"Change Password"}>
              <ListItem 
                button 
                component={Link} 
                to="/change-password"
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'rgba(198, 40, 40, 0.08)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon>
                  <VpnKey sx={{ color: '#c62828' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={"Change Password"} 
                  sx={{ 
                    '& .MuiListItemText-primary': { 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    } 
                  }} 
                />
              </ListItem>
            </MenuTooltip>
          )}

          {/* Log Out */}
          <MenuTooltip title={token !== "guest" ? "Log Out" : "Log In"}>
            <ListItem 
              button 
              onClick={signOut}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon>
                <ExitToApp sx={{ color: '#c62828' }} />
              </ListItemIcon>
              <ListItemText 
                primary={token !== "guest" ? "Log Out" : "Log In"} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  } 
                }} 
              />
            </ListItem>
          </MenuTooltip>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;