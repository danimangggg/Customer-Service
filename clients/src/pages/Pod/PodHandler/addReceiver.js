import AddReceiverController from '../../../components/Pod/PodHandler/addReceiver'
import {Link} from 'react-router-dom'
import { FaTimes} from 'react-icons/fa'
//import './addPodHandler.css'
const ReceiverPage = () => {
  return (
    <div className='container'>
       <Link to="/viewreceiver" >
      <span >
        <FaTimes className='icon' size="30" style={{marginTop: "60px"}}/>
        </span>
      </Link>
      <br/>
      <br/>
      <AddReceiverController />
   
      
    </div>
  )
}

export default ReceiverPage
