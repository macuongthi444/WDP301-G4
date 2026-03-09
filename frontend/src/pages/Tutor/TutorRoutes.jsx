// src/layouts/MainContent.jsx  (đổi tên tốt hơn là TutorRoutes hoặc TutorProtectedRoutes)
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import TutorDashboard from './Dashboard/Dashboard';
import TutorStudents from './Student/Students';
import StudentDetail from './Student/StudentDetail'
import TutorClasses from './Class/Class';
import TutorSchedule from './Schedule/Schedule';
import TeachingSessionUIDetail from "./TeachingSession/TeachingSessionUIDetail"; //
import ClassDetail from './Class/ClassDetail';
import TutorSyllabus from './Syllabus/Syllabus';   
import SyllabusDetail from './Syllabus/SyllabusDetail';            
// import các page khác...
import TutorAssignments from './Assignment/TutorAssignments'
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
      <Route path="students/my" element={<TutorStudents />} />
      <Route path="students/:studentId" element={<StudentDetail />} />
      <Route path="classes" element={<TutorClasses />} />
      <Route path="schedule" element={<TutorSchedule />} />

      <Route path="teaching/:classId" element={<TeachingSessionUIDetail />} />
      <Route path="classes/:classId" element={<ClassDetail />} />
      <Route path="syllabus" element={<TutorSyllabus />} />
      <Route path="syllabus/:id" element={<SyllabusDetail />} />
<Route path="/assignments" element={<TutorAssignments />} />

      <Route path="*" element={<Navigate to="/tutor" replace />} />
    </Routes>
  );
};

export default TutorRoutes;