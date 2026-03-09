import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import AdminDashboard from './AdminDashboard';
import AccountList from './AccountList';

const AdminRoutes = () => {
  const { isLoggedIn, userRoles } = useAuth();

  const isAdmin = userRoles?.some(
    (r) =>
      String(r).toUpperCase().includes('ADMIN') ||
      String(r).toUpperCase() === 'ROLE_ADMIN'
  );

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="accounts" element={<AccountList />} />

      {/* /admin -> /admin/dashboard */}
      <Route index element={<Navigate to="/admin/dashboard" replace />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;