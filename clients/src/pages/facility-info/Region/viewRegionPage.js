import React from 'react'
import RegionComponent from '../../../components/facility-info/Region/RegionComponent'
import './viewRegionPage.css'
import {Link } from "react-router-dom";
import {  FaPlusSquare } from 'react-icons/fa'
import Navbar2 from '../../../components/Navbar/Navbar2'


const FacilityInfoPage = () => {

  if(localStorage.getItem("token") !== "guest"){
  return (
    <>
    <Navbar2/>
    <div className='container' >
      
      <Link to="/add-region">
      <span>
        <FaPlusSquare className='addIcon' size="40"/>
        </span>
      </Link>
      <div className='table'>
      <RegionComponent/>
      </div>
    </div>
    </>
  )
  }else{
    return (
      <>
      <Navbar2/>
      <div className='container' >
        
       <br/><br/><br/><br/>
        <div className='table'>
        <RegionComponent/>
        </div>
      </div>
      </>
    )
  }
}

export default FacilityInfoPage
