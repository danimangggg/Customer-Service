import React from 'react';
import UserManagement from '../../components/Settings/UserManagement';

const UserManagementPage = () => {
  const jobTitle = localStorage.getItem('JobTitle');
  const isViewOnly = jobTitle === 'Manager' || jobTitle === 'Coordinator';

  return (
    <>
      <UserManagement viewOnly={isViewOnly} />
    </>
  );
};

export default UserManagementPage;
