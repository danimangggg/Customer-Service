import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Security
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = () => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const signOut = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const rawAccountType = localStorage.getItem("AccountType") || "";
  const token = localStorage.getItem("token");
  const fullName = localStorage.getItem("FullName") || 'Guest';
  const accountType = rawAccountType;
  const jobTitle = localStorage.getItem("JobTitle");

  const isAdmin = accountType === "Admin";
  const isCreditManager = accountType === "Credit Manager";

  // Helper function to check if current path matches the menu item
  const isActivePath = (path) => location.pathname === path;

  // Helper function to get active menu item styles
  const getActiveStyles = (path) => ({
    borderRadius: 2,
    mx: 1,
    mb: 1,
    bgcolor: isActivePath(path) ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
    borderLeft: isActivePath(path) ? 4 : 0,
    borderColor: isActivePath(path) ? '#1976d2' : 'transparent',
    '&:hover': {
      bgcolor: 'rgba(25, 118, 210, 0.1)',
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
            bgcolor: '#1a1a2e',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: 'white',
            overflowX: 'hidden',
            position: 'fixed',
            height: '100vh',
            boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            border: 'none',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.3)',
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
                WebkitBoxOrient: 'vertical'
              }
            }
          },
        }}
      >
        {/* Enhanced Header */}
        <Box sx={{ 
          bgcolor: 'rgba(107, 66, 38, 0.9)',
          backdropFilter: 'blur(10px)',
          px: 3,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              component="img"
              src="/pharmalog-logo.png"
              alt="PharmaLog Logo"
              sx={{ 
                width: 70, 
                height: 70,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ 
                fontSize: '1.3rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                PharmaLog
              </Typography>
            </Box>
          </Stack>
        </Box>

       <List sx={{ pt: 2, px: 1 }}>
         {/* DASHBOARDS SECTION - AT THE TOP */}
         
         {/* HP Dashboard - for HP Officers, PI Officers, Documentation Officers, Documentation Followers, Quality Evaluators, HP Dispatchers, TM Managers, and Admin */}
         {(jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP" || jobTitle === "PI Officer-HP" || jobTitle === "Documentation Officer" || jobTitle === "Documentation Follower" || jobTitle === "Quality Evaluator" || jobTitle === "Dispatcher - HP" || jobTitle === "TM Manager" || isAdmin) && (
           <MenuTooltip title={"HP Dashboard"}>
             <ListItem 
               button 
               component={Link} 
               to="/hp-dashboard"
               sx={getActiveStyles('/hp-dashboard')}
             >
               <ListItemIcon>
                 <Dashboard sx={{ color: '#4caf50' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"HP Dashboard"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/hp-dashboard') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* MAIN NAVIGATION ITEMS */}

         {/* Outstanding Process (HP Facilities) - for HP Officers */}
         {(jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP") && (
           <MenuTooltip title={"Outstanding Process (HP)"}>
             <ListItem 
               button 
               component={Link} 
               to="/hp-facilities"
               sx={getActiveStyles('/hp-facilities')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#4caf50' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process (HP)"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/hp-facilities') ? 600 : 500,
                     fontSize: '0.85rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   } 
                 }} 
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
                 <Assignment sx={{ color: '#ff9800' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/outstandingProcess') ? 600 : 500,
                     fontSize: '0.85rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Register Customer - for Customer Service Officers */}
         {jobTitle === "Customer Service Officer" && (
           <MenuTooltip title={"Register Customer"}>
             <ListItem 
               button 
               component={Link} 
               to="/register-customer"
               sx={getActiveStyles('/register-customer')}
             >
               <ListItemIcon>
                 <AddCircleOutline sx={{ color: '#4caf50' }} />
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
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#ff9800' }} />
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
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <LocalShipping sx={{ color: '#4caf50' }} />
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

         {/* Documentation Management - for Documentation Officer */}
         {jobTitle === "Documentation Officer" && (
           <MenuTooltip title={"Documentation Management"}>
             <ListItem 
               button 
               component={Link} 
               to="/documentation-management"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Description sx={{ color: '#9c27b0' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Doc Management"} 
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

         {/* Document Follow-up - for Documentation Follower */}
         {jobTitle === "Documentation Follower" && (
           <MenuTooltip title={"Document Follow-up"}>
             <ListItem 
               button 
               component={Link} 
               to="/document-followup"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#2196f3' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Document Follow-up"} 
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
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#4caf50' }} />
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
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#ff9800' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Outstanding Process"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: 500,
                     fontSize: '0.85rem',
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
                 <Receipt sx={{ color: '#4caf50' }} />
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

         {/* Gate Security - for Gate Keeper */}
         {jobTitle === "Gate Keeper" && (
           <MenuTooltip title={"Gate Security"}>
             <ListItem 
               button 
               component={Link} 
               to="/gate-keeper"
               sx={getActiveStyles('/gate-keeper')}
             >
               <ListItemIcon>
                 <Security sx={{ color: '#2196f3' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Gate Security"} 
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
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Inventory sx={{ color: '#9c27b0' }} />
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

         {/* TV Main Menu - for TV Operator only */}
         {jobTitle === "TV Operator" && (
           <MenuTooltip title={"TV Main Menu"}>
             <ListItem 
               button 
               component={Link} 
               to="/tv-main-menu"
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 '&:hover': {
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                   transition: 'all 0.2s ease'
                 },
                 transition: 'all 0.2s ease'
               }}
             >
               <ListItemIcon>
                 <Tv sx={{ color: '#2196f3' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"TV Main Menu"} 
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

         {/* Settings Menu - Admin only */}
         {isAdmin && (
           <>
             <MenuTooltip title={"Settings"}>
               <ListItem 
                 button 
                 onClick={() => setSettingsOpen(!settingsOpen)}
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 1,
                   bgcolor: settingsOpen ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
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
                 {/* Organization Profile */}
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
                           fontSize: '0.85rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>

                 {/* Store Management */}
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
                       <Store sx={{ color: '#9c27b0' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Store Management"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/store-management') ? 600 : 500,
                           fontSize: '0.85rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>

                 {/* User Management */}
                 <MenuTooltip title={"User Management"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/settings/user-management"
                     sx={{
                       ...getActiveStyles('/settings/user-management'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <ManageAccounts sx={{ color: '#9c27b0' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"User Management"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/user-management') ? 600 : 500,
                           fontSize: '0.85rem',
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
                       <Group sx={{ color: '#f44336' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"Account Types & Roles"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/settings/account-types') ? 600 : 500,
                           fontSize: '0.85rem',
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
                       <VpnKey sx={{ color: '#ff9800' }} />
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





         {/* Route Assignment - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <MenuTooltip title={"Route Assignment"}>
             <ListItem 
               button 
               component={Link} 
               to="/transportation/route-management"
               sx={getActiveStyles('/transportation/route-management')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#607d8b' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Route Assignment"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/transportation/route-management') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Routes - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <MenuTooltip title={"Routes"}>
             <ListItem 
               button 
               component={Link} 
               to="/transportation/routes"
               sx={getActiveStyles('/transportation/routes')}
             >
               <ListItemIcon>
                 <Route sx={{ color: '#2196f3' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Routes"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/transportation/routes') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* Vehicle Management - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <MenuTooltip title={"Vehicle Management"}>
             <ListItem 
               button 
               component={Link} 
               to="/transportation/vehicle-management"
               sx={getActiveStyles('/transportation/vehicle-management')}
             >
               <ListItemIcon>
                 <DirectionsCar sx={{ color: '#ff9800' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Vehicle Management"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/transportation/vehicle-management') ? 600 : 500,
                     fontSize: '0.85rem',
                     lineHeight: 1.2,
                     whiteSpace: 'normal',
                     wordWrap: 'break-word'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}

         {/* HP Facilities - TM Manager only */}
         {jobTitle === "TM Manager" && (
           <MenuTooltip title={"HP Facilities"}>
             <ListItem 
               button 
               component={Link} 
               to="/transportation/hp-facilities"
               sx={getActiveStyles('/transportation/hp-facilities')}
             >
               <ListItemIcon>
                 <LocalHospital sx={{ color: '#4caf50' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"HP Facilities"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/transportation/hp-facilities') ? 600 : 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
             </ListItem>
           </MenuTooltip>
         )}



         {/* Reports Menu - for Admin, Manager, Coordinator (shows both HP and RDF) */}
         {(isAdmin || jobTitle === "Coordinator" || jobTitle === "Manager") && (
           <>
             <MenuTooltip title={"Reports"}>
               <ListItem 
                 button 
                 onClick={() => setReportsOpen(!reportsOpen)}
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 1,
                   bgcolor: reportsOpen ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
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
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: reportsOpen ? 600 : 500,
                       fontSize: '0.95rem'
                     } 
                   }} 
                 />
                 {reportsOpen ? <ExpandLess /> : <ExpandMore />}
               </ListItem>
             </MenuTooltip>
             
             <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
               <List component="div" disablePadding>
                 {/* HP Report */}
                 <MenuTooltip title={"HP Report"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/reports/hp-comprehensive"
                     sx={{
                       ...getActiveStyles('/reports/hp-comprehensive'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <BarChart sx={{ color: '#4caf50' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"HP Report"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 500,
                           fontSize: '0.85rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>

                 {/* RDF Report */}
                 <MenuTooltip title={"RDF Report"}>
                   <ListItem 
                     button 
                     component={Link} 
                     to="/reports/rdf"
                     sx={{
                       ...getActiveStyles('/reports/rdf'),
                       pl: 4,
                       ml: 2,
                       mr: 1
                     }}
                   >
                     <ListItemIcon>
                       <BarChart sx={{ color: '#2196f3' }} />
                     </ListItemIcon>
                     <ListItemText 
                       primary={"RDF Report"} 
                       sx={{ 
                         '& .MuiListItemText-primary': { 
                           fontWeight: isActivePath('/reports/rdf') ? 600 : 500,
                           fontSize: '0.85rem',
                           lineHeight: 1.2,
                           whiteSpace: 'normal',
                           wordWrap: 'break-word'
                         } 
                       }} 
                     />
                   </ListItem>
                 </MenuTooltip>
               </List>
             </Collapse>
           </>
         )}

         {/* HP Report - for HP users only */}
         {!isAdmin && jobTitle !== "Coordinator" && jobTitle !== "Manager" && (jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP" || jobTitle === "PI Officer-HP" || jobTitle === "Documentation Officer" || jobTitle === "Documentation Follower" || jobTitle === "Quality Evaluator" || jobTitle === "Dispatcher - HP" || jobTitle === "TM Manager") && (
           <MenuTooltip title={"HP Report"}>
             <ListItem 
               button 
               component={Link} 
               to="/reports/hp-comprehensive"
               sx={getActiveStyles('/reports/hp-comprehensive')}
             >
               <ListItemIcon>
                 <BarChart sx={{ color: '#4caf50' }} />
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

         {/* RDF Report - for Customer Service users only */}
         {!isAdmin && jobTitle !== "Coordinator" && jobTitle !== "Manager" && (jobTitle === "O2C Officer" || jobTitle === "EWM Officer" || jobTitle === "Customer Service Officer" || jobTitle === "Finance") && (
           <MenuTooltip title={"RDF Report"}>
             <ListItem 
               button 
               component={Link} 
               to="/reports/rdf"
               sx={getActiveStyles('/reports/rdf')}
             >
               <ListItemIcon>
                 <BarChart sx={{ color: '#2196f3' }} />
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

        </List>

        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />

        {/* User Info Section - Bottom */}
        <Box sx={{ mt: 'auto', px: 2, py: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mx: 1, mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AccountCircle />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="600" noWrap sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                {fullName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                {jobTitle || accountType || 'User'}
              </Typography>
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
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon>
                  <VpnKey sx={{ color: '#4caf50' }} />
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
                <ExitToApp sx={{ color: '#f44336' }} />
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