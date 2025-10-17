import "./pageStyle.css"
import Dashboard from "../../components/Dashboard/dashboard"
import './Dashboard.css'
import Navbar from '../../components/Navbar/Navbar2'

function Dashbord(){

return (
    <div className="dashboard">
        <Navbar/>
        <br className="dash"/>
       <Dashboard/>
    </div>
)   
    
}
export default Dashbord