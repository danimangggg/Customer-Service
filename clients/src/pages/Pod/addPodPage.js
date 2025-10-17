
import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'
import AddPod from '../../components/Pod/addPodComponent';

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
      <AddPod />
    </div>
  )
}

export default AddPodPage