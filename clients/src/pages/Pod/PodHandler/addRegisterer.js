import AddRegistererComponent from '../../../components/Pod/PodHandler/addRegisterer'
import {Link} from 'react-router-dom'
import { FaBackward} from 'react-icons/fa'
const RegistererPage = () => {
  return (
    <div>
       <Link to="/viewregistrant" >
      <span >
        <FaBackward className='icon' size="30" style={{marginTop: "60px"}}/>
        </span>
      </Link>

      <AddRegistererComponent/>
    </div>
  )
}

export default RegistererPage
