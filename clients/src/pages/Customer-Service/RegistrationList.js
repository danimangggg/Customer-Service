
import Navbar2 from '../../components/Navbar/Navbar2'
import RegisterList from '../../components/Customer-Service/RegistrationList';

const RegistrationListPage = () => {
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
      <RegisterList />
    </div>
    </>
  )
}

export default RegistrationListPage