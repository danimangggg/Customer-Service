import ZoneComponent from '../../../components/facility-info/Zone/addZone'
import './zonePage.css'
import {Link } from "react-router-dom";
import {  FaBackward } from 'react-icons/fa'

const zone = () => {
  return (
    <div >
      <Link to="/viewZone" >
      <span >
        <FaBackward className='icon' size="30" style={{ marginTop: '60px' }}/>
        </span>
      </Link>
     
     <br/>
      <ZoneComponent/>
    </div>
  )
}

export default zone
