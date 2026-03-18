import Swal from 'sweetalert2';

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const successToast = (message) => toast.fire({ icon: 'success', title: message });
export const errorToast = (message) => toast.fire({ icon: 'error', title: message });
export const infoToast = (message) => toast.fire({ icon: 'info', title: message });
