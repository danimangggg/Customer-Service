
import Navbar2 from '../../components/Navbar/Navbar2'
import RegisterCustomer from '../../components/Customer-Service/RegisterCustomer';

const RegisterCustomerPage = () => {
  return (
    <>
    <Navbar2/>
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
      <RegisterCustomer />
    </div>
    </>
  )
}

export default RegisterCustomerPage