
import { useState } from 'react';
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import { FaEdit,  FaTrash, FaBackward, FaPlus } from 'react-icons/fa'
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
          deleteContractFunction()
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

    const deleteContractFunction = ()=>{
      try{
      const res = axios.delete(`${api_url}/api/deleteContract/${id}`);
      setResponse(res.data);
      navigate({pathname: '/viewContract'});
      navigate(0);
      }catch (error){
        console.log(error)
      }
    }

    const editContract = () =>{
      navigate({pathname: '/updateCreadit'}, {state:{idNo : id}});      
    }

    const addPdfPages = () =>{
      navigate({pathname: '/add-credit-pdf'}, {state:{fileName : docName}});      
    }
    
  if(localStorage.getItem("AccountType") === "Credit Manager" || localStorage.getItem("AccountType") === "Admin" ){
  return (
    <div style={{ width: '100%', height: '800px', backgroundColor: '#333' }}>
      <Link to="/viewContract"  >
      <span >
        <FaBackward className='icon' size="30" style={{ marginTop: '20px', marginRight:'80px', color: 'white'}}/>
        </span>
      </Link>
      
      <span >
        <FaTrash onClick={confirmDeleteAlert} className='icon' size="30" style={{ marginTop: '20px', color: 'white'}}/>
        </span>

      <span >
        <FaEdit onClick={editContract} className='icon' size="30" style={{ marginTop: '20px', color: 'white'}}/>
        </span>
        
      <span >
        <FaPlus onClick={addPdfPages} className='icon' size="30" style={{ marginTop: '20px', marginRight:'80px', color: 'white'}}/>
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
        <Link to="/viewContract"  >
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
