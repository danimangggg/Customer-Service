import FacilityComponent from '../../../components/facility-info/Facility/DisplayFacility/showFacility'
import './viewFacilityPage.css'
import {Link } from "react-router-dom";
import {  FaPlusSquare } from 'react-icons/fa'
import Navbar2 from '../../../components/Navbar/Navbar2'


const FacilityInfoPage = () => {

    return (
      <>
      <Navbar2/>
      <br/><br/>
      <div className='container'>
        <FacilityComponent/>
        <br/><br/>
      </div>
      </>
    )
  }

export default FacilityInfoPage
