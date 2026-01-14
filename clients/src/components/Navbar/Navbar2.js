import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Divider,
  Tooltip,
  Avatar,
  Chip,
  Stack
} from '@mui/material';
import {
  Assignment,
  ExpandLess,
  ExpandMore,
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
  Description
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = () => {
  const [reportsOpen, setReportsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transportationOpen, setTransportationOpen] = useState(false);
  const location = useLocation();

  const handleReportsToggle = () => setReportsOpen(!reportsOpen);
  const handleSettingsToggle = () => setSettingsOpen(!settingsOpen);
  const handleTransportationToggle = () => setTransportationOpen(!transportationOpen);

  const signOut = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const rawAccountType = localStorage.getItem("AccountType") || "";
  const rawPosition = localStorage.getItem("Position") || "";
  const token = localStorage.getItem("token");
  const fullName = localStorage.getItem("FullName") || 'Guest';
  const accountType = rawAccountType;
  const position = rawPosition.trim().toLowerCase();
  const jobTitle = localStorage.getItem("JobTitle");
  const department = localStorage.getItem("Department");

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
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 48, 
                height: 48,
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <LocalHospital />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>
                EPSS - Hub 1
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                Customer Service System
              </Typography>
            </Box>
          </Stack>
        </Box>

       <List sx={{ pt: 2, px: 1 }}>
         {/* DASHBOARDS SECTION - AT THE TOP */}
         
         {/* HP Dashboard - for HP Officers, PI Officers, Documentation Officers, Documentation Followers, Quality Evaluators, Dispatchers, TM Managers, and Transport Management department */}
         {(jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP" || jobTitle === "PI Officer-HP" || jobTitle === "Documentation Officer" || jobTitle === "Documentation Follower" || jobTitle === "Quality Evaluator" || jobTitle === "Dispatcher" || jobTitle === "Dispatcher - HP" || jobTitle === "TM Manager" || department === "Transport Management" || department === "Transportation Management") && (
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

         {/* Service Time Management - for O2C Officers, EWM Officers, and Customer Service Officers */}
         {(jobTitle === "O2C Officer" || jobTitle === "EWM Officer" || jobTitle === "Customer Service Officer") && (
           <MenuTooltip title={"Service Time Management"}>
             <ListItem 
               button 
               component={Link} 
               to="/service-time-management"
               sx={getActiveStyles('/service-time-management')}
             >
               <ListItemIcon>
                 <Assignment sx={{ color: '#2196f3' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Service Time"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontWeight: isActivePath('/service-time-management') ? 600 : 500,
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

         {/* Customer Registration - for all users */}
         {(isAdmin || jobTitle === "Customer Service Officer") && (
           <MenuTooltip title={"Customer Registration"}>
             <ListItem 
               button 
               component={Link} 
               to="/register-customer"
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
                 <AddCircleOutline sx={{ color: '#00bcd4' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Customer Registration"} 
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

         {/* Settings Menu - for Admin users only */}
         {isAdmin && (
           <MenuTooltip title={"Settings"}>
             <ListItem 
               button 
               onClick={handleSettingsToggle}
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 bgcolor: settingsOpen ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
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
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
               {settingsOpen ? <ExpandLess /> : <ExpandMore />}
             </ListItem>
           </MenuTooltip>
         )}

         {/* Settings Sub-menu */}
         <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
           <List component="div" disablePadding sx={{ pl: 2 }}>
             {/* Organization Profile */}
             <MenuTooltip title={"Organization Profile"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/settings/organization-profile"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <Business sx={{ color: '#795548', fontSize: 20 }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Organization Profile"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: 400,
                       fontSize: '0.8rem',
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
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <ManageAccounts sx={{ color: '#9c27b0', fontSize: 20 }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"User Management"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: 400,
                       fontSize: '0.8rem',
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
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <Group sx={{ color: '#f44336', fontSize: 20 }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Account Types & Roles"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: 400,
                       fontSize: '0.9rem'
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>
           </List>
         </Collapse>

         {/* Transportation Menu - for TM Managers */}
         {(jobTitle === "TM Manager") && (
           <MenuTooltip title={"Transportation"}>
             <ListItem 
               button 
               onClick={handleTransportationToggle}
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 bgcolor: transportationOpen ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                 '&:hover': {
                   bgcolor: 'rgba(25, 118, 210, 0.1)',
                   transform: 'translateX(4px)',
                 },
                 transition: 'all 0.2s ease-in-out',
               }}
             >
               <ListItemIcon>
                 <LocalShipping sx={{ color: '#607d8b' }} />
               </ListItemIcon>
               <ListItemText 
                 primary={"Transportation"} 
                 sx={{ 
                   '& .MuiListItemText-primary': { 
                     fontSize: '0.875rem',
                     fontWeight: 500,
                   } 
                 }} 
               />
               {transportationOpen ? <ExpandLess /> : <ExpandMore />}
             </ListItem>
           </MenuTooltip>
         )}

         {/* Transportation Sub-menu */}
         <Collapse in={transportationOpen} timeout="auto" unmountOnExit>
           <List component="div" disablePadding sx={{ pl: 2 }}>
             {/* Route Management */}
             <MenuTooltip title={"Route Management"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/transportation/route-management"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.08)',
                     transform: 'translateX(4px)',
                   },
                   transition: 'all 0.2s ease-in-out',
                 }}
               >
                 <ListItemIcon>
                   <Assignment sx={{ color: '#607d8b', fontSize: '1.2rem' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Route Assignment"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontSize: '0.8rem',
                       fontWeight: 400,
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>

             {/* Routes CRUD */}
             <MenuTooltip title={"Routes"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/transportation/routes"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.08)',
                     transform: 'translateX(4px)',
                   },
                   transition: 'all 0.2s ease-in-out',
                 }}
               >
                 <ListItemIcon>
                   <Route sx={{ color: '#607d8b', fontSize: '1.2rem' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Routes"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontSize: '0.8rem',
                       fontWeight: 400,
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>

             {/* Vehicle Management */}
             <MenuTooltip title={"Vehicle Management"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/transportation/vehicle-management"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.08)',
                     transform: 'translateX(4px)',
                   },
                   transition: 'all 0.2s ease-in-out',
                 }}
               >
                 <ListItemIcon>
                   <DirectionsCar sx={{ color: '#607d8b', fontSize: '1.2rem' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Vehicle Management"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontSize: '0.75rem',
                       fontWeight: 400,
                       lineHeight: 1.2,
                       whiteSpace: 'normal',
                       wordWrap: 'break-word'
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>

             {/* HP Facilities */}
             <MenuTooltip title={"HP Facilities"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/transportation/hp-facilities"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.08)',
                     transform: 'translateX(4px)',
                   },
                   transition: 'all 0.2s ease-in-out',
                 }}
               >
                 <ListItemIcon>
                   <LocalHospital sx={{ color: '#607d8b', fontSize: '1.2rem' }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"HP Facilities"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontSize: '0.8rem',
                       fontWeight: 400,
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>


           </List>
         </Collapse>

         {/* Reports Menu - for all users */}
         {(isAdmin || position === "manager" || position === "coordinator" || jobTitle === "O2C Officer" || jobTitle === "EWM Officer" || jobTitle === "Customer Service Officer" || jobTitle === "Finance" || jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP") && (
           <MenuTooltip title={"Reports"}>
             <ListItem 
               button 
               onClick={handleReportsToggle}
               sx={{
                 borderRadius: 2,
                 mx: 1,
                 mb: 1,
                 bgcolor: reportsOpen ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
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
                     fontWeight: 500,
                     fontSize: '0.95rem'
                   } 
                 }} 
               />
               {reportsOpen ? <ExpandLess /> : <ExpandMore />}
             </ListItem>
           </MenuTooltip>
         )}

         {/* Reports Sub-menu */}
         <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
           <List component="div" disablePadding sx={{ pl: 2 }}>
             {/* HP Comprehensive Report - for HP Officers */}
             {(jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP") && (
               <MenuTooltip title={"HP Comprehensive Report"}>
                 <ListItem 
                   button 
                   component={Link} 
                   to="/reports/hp-comprehensive"
                   sx={{
                     borderRadius: 2,
                     mx: 1,
                     mb: 0.5,
                     bgcolor: isActivePath('/reports/hp-comprehensive') ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
                     borderLeft: isActivePath('/reports/hp-comprehensive') ? 4 : 0,
                     borderColor: isActivePath('/reports/hp-comprehensive') ? '#1976d2' : 'transparent',
                     '&:hover': {
                       bgcolor: 'rgba(25, 118, 210, 0.1)',
                       transform: 'translateX(4px)',
                       transition: 'all 0.2s ease'
                     },
                     transition: 'all 0.2s ease'
                   }}
                 >
                   <ListItemIcon>
                     <Assessment sx={{ color: '#4caf50', fontSize: 20 }} />
                   </ListItemIcon>
                   <ListItemText 
                     primary={"HP Comprehensive Report"} 
                     sx={{ 
                       '& .MuiListItemText-primary': { 
                         fontWeight: isActivePath('/reports/hp-comprehensive') ? 600 : 400,
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

             {/* All Picklists */}
             <MenuTooltip title={"All Picklists"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/reports/all-picklists"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <Assignment sx={{ color: '#9c27b0', fontSize: 20 }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"All Picklists"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: 400,
                       fontSize: '0.9rem'
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>

             {/* Organization Profile - View Only for all users */}
             <MenuTooltip title={"Organization Profile"}>
               <ListItem 
                 button 
                 component={Link} 
                 to="/reports/organization-profile"
                 sx={{
                   borderRadius: 2,
                   mx: 1,
                   mb: 0.5,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.1)',
                     transform: 'translateX(4px)',
                     transition: 'all 0.2s ease'
                   },
                   transition: 'all 0.2s ease'
                 }}
               >
                 <ListItemIcon>
                   <Business sx={{ color: '#795548', fontSize: 20 }} />
                 </ListItemIcon>
                 <ListItemText 
                   primary={"Organization Profile"} 
                   sx={{ 
                     '& .MuiListItemText-primary': { 
                       fontWeight: 400,
                       fontSize: '0.9rem'
                     } 
                   }} 
                 />
               </ListItem>
             </MenuTooltip>
           </List>
         </Collapse>

          {(isCreditManager || isAdmin) && (
            <MenuTooltip title={"All Employees"}>
              <ListItem 
                button 
                component={Link} 
                to="/all-employee"
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
                  <Group sx={{ color: '#795548' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={"All Employees"} 
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

        </List>

        <Divider sx={{ my: 2, bgcolor: '#333' }} />

        <List sx={{ mt: 'auto' }}>
          <ListItem>
            <ListItemIcon><AccountCircle sx={{ color: 'white' }} /></ListItemIcon>
            <ListItemText primary={fullName} />
          </ListItem>

          {isAdmin && (
            <>
              <ListItem button component={Link} to="/users">
                <ListItemIcon><Group sx={{ color: 'white' }} /></ListItemIcon>
                <ListItemText primary={"Users"} />
              </ListItem>
              <ListItem button component={Link} to="/reset-password">
                <ListItemIcon><VpnKey sx={{ color: 'white' }} /></ListItemIcon>
                <ListItemText primary={"Reset Password"} />
              </ListItem>
            </>
          )}

          {token !== "guest" && (
            <ListItem button component={Link} to="/change-password">
              <ListItemIcon><VpnKey sx={{ color: 'white' }} /></ListItemIcon>
              <ListItemText primary={"Change Password"} />
            </ListItem>
          )}

          <ListItem button onClick={signOut}>
            <ListItemIcon><ExitToApp sx={{ color: 'white' }} /></ListItemIcon>
            <ListItemText primary={token !== "guest" ? "Log Out" : "Log In"} />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;