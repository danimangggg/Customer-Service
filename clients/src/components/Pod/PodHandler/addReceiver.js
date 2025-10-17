import { useState } from 'react';
import './addPodHandler.css';
import axios from 'axios'

const AddReciver = () => {
  const api_url = process.env.REACT_APP_API_URL;
  const [receiver, setReceiver]= useState('')

  const submitUploaded = async (e) =>{       
    e.preventDefault();
    const formdata = new FormData();
    formdata.append('receiver', receiver);
    await axios.post(`${api_url}/api/addReceivedBy`, formdata)
      .then((res) =>{
        alert(res.data.message);
        window.location.reload();
      })
      .catch((err)=> alert("erro on uploading file"));
       }


  return (
    <div className="form-containerPod" >
      <form className="form" onSubmit={submitUploaded}>
         <h2 className="form-titlePod">Add Pod Receiver</h2>

        <div className="form-groupPod">
          <label htmlFor="name" className="form-label">Receiver</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={receiver}
            onChange={(e)=> setReceiver(e.target.value)}
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
