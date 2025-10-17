import MUIDataTable from "mui-datatables";
import { useEffect, useState } from 'react';

const RegionComponent = () => {

    const api_url = process.env.REACT_APP_API_URL;
    const [info , setData] = useState([])
    const columns = [
        {
         name: "region_name",
         label: "Region",
         options: {
          filter: true,
          sort: false,
         }
        },
        
       ];

    const getUser =  ()=>{
        fetch(`${api_url}/api/regions`)
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
       
  return (
    <div style={{display: 'table', tableLayout:'fixed'}}>
       
        <MUIDataTable
        title={"Region list"}
        data={info}
        columns={columns}
        options={options}
            />
    </div>
  )
}

export default RegionComponent



