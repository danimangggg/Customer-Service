import AddCreadit from  '../../components/Creadit-Info/AddCreaditComponent'

import {Link } from "react-router-dom";
import {  FaTimes } from 'react-icons/fa'
import TaskTracking from '../../components/Performance-tracking/TaskTracking';

const TaskTrackingPage = () => {
  return (
    <div className='container'>
      <br/>
    <Link to="/all-employee"  >
      <span >
        <FaTimes className='icon' size="30" style={{ marginTop: '10px' }}/>
        </span>
      </Link>
     <br/>
      <TaskTracking />
    </div>
  )
}

export default TaskTrackingPage