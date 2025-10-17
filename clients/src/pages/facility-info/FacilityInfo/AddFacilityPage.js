import AddFacility from  '../../../components/facility-info/Facility/AddFacility/AddFacility'
import './AddFacilityPage.css'
import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'

const AddFacilityPage = () => {
  return (
    <div className='container'>
    <Link to="/facility-profile" >
      <span >
        <FaTimes className='icon' size="30" style={{ marginTop: '20px' }}/>
        </span>
      </Link>
     
      <AddFacility/>
    </div>
  )
}

export default AddFacilityPage