// src/layouts/TutorLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import TutorSidebar from './TutorSidebar';
import TutorRoutes from './TutorRoutes';
const TutorLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden lg:block">
        <TutorSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <TutorRoutes /> 
      </main>
    </div>
  );
};

export default TutorLayout;