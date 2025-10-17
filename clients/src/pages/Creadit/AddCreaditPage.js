import AddCreadit from  '../../components/Creadit-Info/AddCreaditComponent'

import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'

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
      <AddCreadit />
    </div>
  )
}

export default AddFacilityPage