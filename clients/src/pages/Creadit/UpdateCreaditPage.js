import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'
import UpdateComponent from '../../components/Creadit-Info/UpdateCreaditComponent';
import './AddFacilityPage.css'
const AddFacilityPage = () => {
  return (
    <div className='container'>
      <br/>
    <Link to="/viewContract"  >
      <span >
        <FaTimes className='icon' size="30" style={{ marginTop: '10px' }}/>
        </span>
      </Link>
     <br/>
      <UpdateComponent />
    </div>
  )
}

export default AddFacilityPage