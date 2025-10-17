
import { useState } from 'react';
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import { FaEdit,  FaTrash, FaBackward } from 'react-icons/fa'
import Swal from 'sweetalert2'
import 'bootstrap/dist/css/bootstrap.css';

const PdfViewer = ({ pdf }) => {
    const navigate = useNavigate();
    const [response, setResponse] = useState(null);
    const api_url = process.env.REACT_APP_API_URL;
    const fileName = useLocation();
    const nameStri = (fileName.state.docname);
    const id = (fileName.state.identity);
    const docName = (nameStri.replace(/['"]+/g, ''));

    const confirmDeleteAlert = () => {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger"
        },
        buttonsStyling: true
      });
      swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success"
          });
          deletePodFunction()
        } else if (
          /* Read more about handling dismissals below */
          result.dismiss === Swal.DismissReason.cancel
        ) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your imaginary file is safe :)",
            icon: "error"
          });
        }
      });
    }

    const deletePodFunction = ()=>{
      try{
      const res = axios.delete(`${api_url}/api/deletePod/${id}`);
      setResponse(res.data);
      navigate({pathname: '/viewPod'});
      window.location.reload();
      }catch (error){
        console.log(error)
      }
    }

    const editPod = () =>{
      navigate({pathname: '/updatePod'}, {state:{idNo : id}});
           
    }

    if(localStorage.getItem("AccountType") === "Pod Manager" || localStorage.getItem("AccountType") === "Admin"){
  return (
    <div style={{ width: '100%', height: '800px', backgroundColor: '#333' }}>
      <Link to="/viewPod"  >
      <span >
        <FaBackward className='icon' size="30" style={{ marginTop: '20px', marginRight:'80px', color: 'white'}}/>
        </span>
      </Link>
      <span >
        <FaTrash onClick={confirmDeleteAlert} className='icon' size="30" style={{ marginTop: '20px', color: 'white'}}/>
        </span>
      <span >
        <FaEdit onClick={editPod} className='icon' size="30" style={{ marginTop: '20px', color: 'white'}}/>
        </span>

      <iframe
        title="Contract document"
        src={`${api_url}/${docName}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
      />
    </div>
  )
    }else{
      return (
        <div style={{ width: '100%', height: '800px', backgroundColor: '#333' }}>
          <Link to="/viewPod"  >
          <span >
            <FaBackward className='icon' size="30" style={{ marginTop: '20px', marginRight:'80px', color: 'white'}}/>
            </span>
          </Link>
    
          <iframe
            title="Contract document"
            src={`${api_url}/${docName}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
          />
        </div>
      )
    }
};

export default PdfViewer;
