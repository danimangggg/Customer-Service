import { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import HpFacilities from './HP-Facilities';
import EWMGoodsIssue from './EWMGoodsIssue';

const EWMOutstanding = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', minHeight: 48 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 }
          }}
        >
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Outstanding Process" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Goods Issue" />
        </Tabs>
      </Box>

      {tab === 0 && <HpFacilities />}
      {tab === 1 && <EWMGoodsIssue />}
    </Box>
  );
};

export default EWMOutstanding;
