import MUIDataTable from "mui-datatables";
import { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import {useNavigate}  from 'react-router-dom'

const ShowFacilityComponent = () => {
    const api_url = process.env.REACT_APP_API_URL;
    const [info, setData] = useState([]);
    const navigate = useNavigate();
    
    const columns = [
        {
            name: "facility_name",
            label: "Org Name",
            options: {
                filter: false,
                sort: true,
            }
        },
        {
            name: "woreda_name",
            label: "Woreda",
            options: {
                filter: false,
                sort: false,
            }
        },
        {
            name: "zone_name",
            label: "Zone/subcity",
            options: {
                filter: true,
                sort: false,
            }
        },
        {
            name: "region_name",
            label: "Region",
            options: {
                filter: true,
                sort: false,
            }
        },
        {
            name: "facility_type",
            label: "Organization Type",
            options: {
                filter: true,
                sort: false,
                display: false
            }
        },
    ];

    const getUser = () => {
        fetch(`${api_url}/api/facilities`)
            .then((e) => e.json())
            .then((info) => setData(info));
    };

    useEffect(() => {
        getUser();
    }, []);

    const getMuiTheme = () => createTheme({
        components: {
            MUIDataTableBodyCell: {
                styleOverrides: {
                    root: {
                        backgroundColor: "white"
                    }
                }
            }
        }
    });

    const addFacility = () => {
        navigate('/add-facility')
    }

    const options = {
        filterType: 'checkbox',
        responsive: 'standard',
        onRowClick: (rowData, rowMeta) => {
            console.log('Row data:', rowData);
            console.log('Row index:', rowMeta.dataIndex);
        },
    };

    return (
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            <ThemeProvider theme={getMuiTheme}>
                <MUIDataTable
                    title={"Organization list"}
                    data={info}
                    columns={columns}
                    options={options}
                />
            </ThemeProvider>

      {  localStorage.getItem("token") !== "guest" ?
            <Fab 
                color="primary" 
                aria-label="add" 
                onClick={addFacility}
                sx={{ position: 'fixed', bottom: 46, right: 46 }}
            >
                <AddIcon />
            </Fab>
           :  null
        }
        </Box>
    );
};

export default ShowFacilityComponent;
