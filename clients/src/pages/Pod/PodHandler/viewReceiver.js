import React from 'react'
import ReceiveComponent from '../../../components/Pod/PodHandler/viewReceiver'

import {Link } from "react-router-dom";
import {  FaPlusSquare } from 'react-icons/fa'
import Navbar2 from '../../../components/Navbar/Navbar2'


const ReceiverPage = () => {
  
  if(localStorage.getItem("token") !== "guest"){
  return (
    <>
    <Navbar2/>
    <div className='container' >
      
      <Link to="/add-receiver">
      <span>
        <FaPlusSquare className='addIcon' size="40"/>
        </span>
      </Link>
      <div className='table'>
      <ReceiveComponent/>
      </div>
    </div>
    </>
  )
  }else{
    return (
      <>
      <Navbar2/>
      <div className='container' >
        <br/> <br/> <br/> <br/>
        <div className='table'>
        <ReceiveComponent/>
        </div>
      </div>
      </>
    )
  }
}

export default ReceiverPage
