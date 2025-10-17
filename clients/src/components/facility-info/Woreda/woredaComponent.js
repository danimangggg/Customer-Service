import MUIDataTable from "mui-datatables";
import { useEffect, useState } from 'react';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import {useNavigate}  from 'react-router-dom'

const WoredaComponent = () => {
  const api_url = process.env.REACT_APP_API_URL;
    const [info , setData] = useState([]);
    const navigate = useNavigate();

    const columns = [
        {
         name: "region_name",
         label: "Region",
         options: {
          filter: true,
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
         name: "woreda_name",
         label: "Woreda",
         options: {
          filter: true,
          sort: false,
         }
        },
        
       ];

    const getUser =  ()=>{
        fetch(`${api_url}/api/woredas`)
        .then((e)=>{
            return e.json()
        })
        .then((info)=>{
        setData(info)
        })       
     }
    useEffect(()=>
        { 
            getUser()
        } ,[])
       
       const options = {
         filterType: 'checkbox',
         responsive: 'standard'
       };

       const addWoreda = () => {
        navigate('/add-woreda')
    }
       
  return (

    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
    <div style={{display: 'table', tableLayout:'fixed'}}>
        <MUIDataTable
        title={"Woreda list"}
        data={info}
        columns={columns}
        options={options}
            />
    </div>
     {  localStorage.getItem("token") !== "guest" ?
     <Fab 
         color="primary" 
         aria-label="add" 
         onClick={addWoreda}
         sx={{ position: 'fixed', bottom: 46, right: 46 }}
     >
         <AddIcon />
     </Fab>
    :  null
 }
 </Box>
  )
}

export default WoredaComponent



