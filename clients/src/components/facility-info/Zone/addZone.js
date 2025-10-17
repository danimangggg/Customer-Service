import { useEffect, useState } from 'react';
import './addZone.css';
import axios from 'axios'

const AddZone = () => {

  const api_url = process.env.REACT_APP_API_URL;
  const [region2, setRegion]= useState('')
  const [zone_Subcity2, setZone_Subcity]= useState('')
  const [infoRegion2 , setData] = useState([])

  const submitZone= async (e) =>{
    
    e.preventDefault();
    const fdata = new FormData();
    fdata.append('region', region2);
    fdata.append('zone', zone_Subcity2);
    await axios.post(`${api_url}/api/addzone`, fdata)
      .then((res)=>{
        alert(res.data.message);
        setRegion("");
        setZone_Subcity('');
      }
        )
      .catch(err=> console.log(err));
    }

    const getRegion =  ()=>{
    fetch(`${api_url}/api/regions`)
    .then((e)=>{
        return e.json()
    })
    .then((infoRegion2)=>{
    setData(infoRegion2)
    })       
    }
    useEffect(()=>
        { 
            getRegion()
        } ,[]) 

  return (
    <div className="form-container">
      <form className="form" onSubmit={submitZone} >
         <h2 className="form-title">Add Zone</h2>
      
         <div className='form-group'>
     <label>
       Region
       <br/><br/>
       <select value={region2} placeholder='select' onChange={(e)=> setRegion(e.target.value)} className='form-input'>
        
       <option>Select Region</option>
       {
        infoRegion2.map((data)=>{
          return(
          <option key={data.region_name} value={data.region_name}>{data.region_name}</option>
               )
         })
       }
       </select>

     </label>
   </div>

   <div className="form-group">
          <label htmlFor="name" className="form-label">Zone/Subcity name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={zone_Subcity2}
            onChange= {(e)=> setZone_Subcity(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="form-button">Submit</button>
      </form>
    </div>
  );
};

export default AddZone;
