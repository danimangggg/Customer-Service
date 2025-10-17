import { useState } from 'react';
import './addPodHandler.css';
import axios from 'axios'

const AddReciver = () => {
  const api_url = process.env.REACT_APP_API_URL;
  const [registerer, setRegisterer]= useState('')

  const submitUploaded = async (e) =>{       
    e.preventDefault();
    const formdata = new FormData();
    formdata.append('registerer', registerer);
    await axios.post(`${api_url}/api/addRegisteredBy`, formdata)
      .then((res) =>{
        alert(res.data.message);
        window.location.reload();
      })
      .catch((err)=> alert("erro on uploading file"));
       }


  return (
    <div className="form-containerPod" >
      <form className="form" onSubmit={submitUploaded}>
         <h2 className="form-titlePod">Add Pod Registrant</h2>

        <div className="form-groupPod">
          <label htmlFor="name" className="form-label">Registrant</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={registerer}
            onChange={(e)=> setRegisterer(e.target.value)}
            required
          />
        </div>
        <br/> <br/>
        <button type="submit" className="form-button">Add</button>
      </form>
    </div>
  );
};

export default AddReciver;
