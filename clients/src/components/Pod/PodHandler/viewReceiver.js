import MUIDataTable from "mui-datatables";
import { useEffect, useState } from 'react';

const ReceivePodComponent = () => {

    const api_url = process.env.REACT_APP_API_URL;
    const [info , setData] = useState([])
    const columns = [
        {
         name: "receiver",
         label: "Recipient",
         options: {
          filter: true,
          sort: false,
         }
        },
        
       ];

    const getUser =  ()=>{
        fetch(`${api_url}/api/receivedBy`)
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
        title={"Pod Recipient list"}
        data={info}
        columns={columns}
        options={options}
            />
    </div>
  )
}

export default ReceivePodComponent



