import React from 'react'
import ChangePasswordComponent from '../../components/UserAccount/ChengePassword'
import {  FaTimes } from 'react-icons/fa'
import {Link} from 'react-router-dom'

export default function ChangePasswordPage() {
  return (
    <div className='container'> 
      <Link to="/"  >
    <span >
      <FaTimes className='icon' size="30" style={{ marginTop: '30px' }}/>
      </span>
    </Link>
      <ChangePasswordComponent/>
    </div>
  )
}
