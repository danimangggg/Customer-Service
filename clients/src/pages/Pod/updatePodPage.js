import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'
import UpdatePodComponent from '../../components/Pod/UpdatePodComponent';
import './AddFacilityPage.css'
const AddPodPage = () => {
  return (
    <div className='container'>
    <br/>
  <Link to="/viewPod"  >
    <span >
      <FaTimes className='icon' size="30" style={{ marginTop: '10px' }}/>
      </span>
    </Link>
   <br/>
      <UpdatePodComponent />
    </div>
  )
}

export default AddPodPage