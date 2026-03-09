import React from 'react';

import AdminRoutes from './AdminRoutes';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto">
        <AdminRoutes />
      </main>
    </div>
  );
};

export default AdminLayout;