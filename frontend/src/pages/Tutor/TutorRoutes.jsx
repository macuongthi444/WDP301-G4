// src/layouts/MainContent.jsx  (đổi tên tốt hơn là TutorRoutes hoặc TutorProtectedRoutes)
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import TutorDashboard from './Dashboard/Dashboard';
import TutorStudents from './Student/Students';
import TutorClasses from './Class/Class';
import TutorSchedule from './Schedule/Schedule';
import TutorTeachingSession from './TeachingSession/TeachingSession'


// import các page khác...

const TutorRoutes = () => {
  const { isLoggedIn, userRoles } = useAuth();

  const isTutor = userRoles?.some(r =>
    String(r).toUpperCase().includes('TUTOR') ||
    String(r).toUpperCase() === 'ROLE_TUTOR'
  );

  if (!isLoggedIn || !isTutor) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="dashboard" element={<TutorDashboard />} />           {/* /tutor */}
      <Route path="students" element={<TutorStudents />} />
      <Route path="classes" element={<TutorClasses />} />
      <Route path="schedule" element={<TutorSchedule />} />
      <Route path="teaching-session/:sessionId" element={<TutorTeachingSession />} />
      {/* ... */}
      <Route path="*" element={<Navigate to="/tutor" replace />} />
    </Routes>
  );
};

export default TutorRoutes;