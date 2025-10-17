import { Link } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Employee from '../../components/Performance-tracking/Employee';
import Navbar2 from '../../components/Navbar/Navbar2';

const EmployeePage = () => {
  return (
    <>
      <Navbar2 />
      <div
        className="content"
        style={{
          marginLeft: 260, // Same as drawerWidth when expanded
          padding: '20px',
          transition: 'margin-left 0.3s ease-in-out',
          backgroundColor: '#f4f4f4',
          minHeight: '100vh',
        }}
      >
        <Employee />
      </div>
    </>
  );
};

export default EmployeePage;
