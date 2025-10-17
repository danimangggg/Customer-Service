import MUIDataTable from "mui-datatables";
import { useEffect, useState } from 'react';

const RegisterPodComponent = () => {

    const api_url = process.env.REACT_APP_API_URL;
    const [info , setData] = useState([])
    const columns = [
        {
         name: "registerer",
         label: "Registrant",
         options: {
          filter: true,
          sort: false,
         }
        },
        
       ];

    const getUser =  ()=>{
        fetch(`${api_url}/api/registeredBy`)
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
        title={"Pod Registrant list"}
        data={info}
        columns={columns}
        options={options}
            />
    </div>
  )
}

export default RegisterPodComponent



