import RegionController from '../../../components/facility-info/Region/addRegion'
import {Link} from 'react-router-dom'
import { FaBackward} from 'react-icons/fa'
import './RegionPage.css'
const RegionPage = () => {
  return (
    <div>
       <Link to="/viewRegion" >
      <span >
        <FaBackward className='icon' size="30" style={{ marginTop: '60px' }}/>
        </span>
      </Link>

      <RegionController/>
    </div>
  )
}

export default RegionPage
