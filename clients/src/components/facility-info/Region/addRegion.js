import { useState } from 'react';
import './addRegion.css';
import axios from 'axios'

const AddRegion = () => {
  const api_url = process.env.REACT_APP_API_URL;
  const [region, setRegion]= useState('')

  const submitUploaded = async (e) =>{       
    e.preventDefault();
    console.log('Region:', region);
    const formdata = new FormData();
    formdata.append('region', region);
    await axios.post(`${api_url}/api/addregion`, formdata)
      .then((res) =>{
        alert(res.data.message);
        setRegion("")
      })
      .catch((err)=> alert("erro on uploading file"));
       }


  return (
    <div className="form-container" >
      <form className="form" onSubmit={submitUploaded}>
         <h2 className="form-title">Add Region</h2>

        <div className="form-group">
          <label htmlFor="name" className="form-label">Region</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={region}
            onChange={(e)=> setRegion(e.target.value)}
            required
          />
        </div>
        <br/> <br/>
        <button type="submit" className="form-button">Add</button>
      </form>
    </div>
  );
};

export default AddRegion;
