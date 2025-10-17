import { useState } from 'react';
import axios from 'axios'
import "./pageStyle.css"


function App(){

    const api_url = process.env.REACT_APP_API_URL;
    const [file, setFile] = useState()
    const [image, setImage] = useState(null)
    const[region, setRegion]= useState('')
    const[zone_Subcity, setZone_Subcity]= useState('')
    const[woreda, setWoreda]= useState('')
    const[facilityName, setFacilityName]= useState('')
    const[facilityDeligate, setFacilityDeligate]= useState('')
    const[creaditAmount, setCreaditAmount]= useState('')

    const submitUploaded = () =>
    {       
        const formdata = new FormData();
        formdata.append('file', file);
        formdata.append('region', region);
        formdata.append('zone_Subcity', zone_Subcity);
        formdata.append('woreda', woreda);
        formdata.append('facilityName', facilityName);
        formdata.append('facilityDeligate', facilityDeligate);
        formdata.append('creaditAmount', creaditAmount);

       axios.post(`${api_url}/upload`, formdata)
        .then(res=> console.log(res))
        .catch(err=> console.log(err));
    }
   
    const onImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
          setImage(URL.createObjectURL(event.target.files[0]));
        } 
    
    }
    const handleFile = (e)=>{
        setFile(e.target.files[0])
    }

    return(
        <div className='center'>
        <form className = 'APP'>
            <h1> Registration Form</h1>
            <br/>
            <p>Region </p> <input type='text' onChange={(e)=> setRegion(e.target.value)}/>  <br/>  <br/>
            <p>Zone/Subcity</p> <input type='text' onChange={(e)=> setZone_Subcity(e.target.value)}/>  <br/>  <br/>
            <p>Woreda</p> <input type='text' onChange={(e)=> setWoreda(e.target.value)}/>  <br/>  <br/>
            <p>Facility Name </p> <input type='text' onChange={(e)=> setFacilityName(e.target.value)}/>  <br/>  <br/>
            <p>Facility Deligate </p> <input type='text' onChange={(e)=> setFacilityDeligate(e.target.value)}/>  <br/>  <br/>
            <p>Creadit Amount </p> <input type='text' onChange={(e)=> setCreaditAmount(e.target.value)}/>  <br/>  <br/> <br/><br/>  
            <label>Attach Document :
                <input type= 'file' onChange={handleFile} />
            </label>
                <br/><br/>
                <button onClick={submitUploaded}>
                    Upload
                </button>
                <br/><br/>
                <button >Display</button>            

        </form>    
        </div>
    );
}

export default App