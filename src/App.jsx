import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import RoleSelection from './pages/auth/RoleSelection';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentHome from './pages/student/StudentHome';
import StudentSchedule from './pages/student/StudentSchedule';
import SyllabusPreview from './pages/student/SyllabusPreview';

// Tutor pages
import TutorDashboard from './pages/tutor/TutorDashboard';
import TeachingSchedule from './pages/tutor/schedule/TeachingSchedule';
import SessionDetail from './pages/tutor/session/SessionDetail';
import ClassManagement from './pages/tutor/class/ClassManagement';
import ClassDetail from './pages/tutor/class/ClassDetail';
import StudentManagement from './pages/tutor/student/StudentManagement';
import StudentDetail from './pages/tutor/student/StudentDetail';
import StudentAssignmentsPage from './pages/tutor/student/StudentAssignmentsPage';
import SyllabusManagement from './pages/tutor/syllabus/SyllabusManagement';
import SyllabusDetail from './pages/tutor/syllabus/SyllabusDetail';
import AssignmentDetail from './pages/tutor/assignment/AssignmentDetail';
import IncomeManagement from './pages/tutor/income/IncomeManagement';
import AIAssistant from './pages/tutor/ai/AIAssistant';

import StudentSessionDetail from './pages/student/StudentSessionDetail';
import StudentSyllabus from './pages/student/StudentSyllabus';
import ParentPayment from './pages/student/ParentPayment';

function App() {
  return (
    <Router>
      <div className="font-sans text-slate-800 selection:bg-blue-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/role-selection" element={<RoleSelection />} />

          {/* Tutor */}
          <Route path="/dashboard" element={<TutorDashboard />} />
          <Route path="/teaching-schedule" element={<TeachingSchedule />} />
          <Route path="/classes" element={<ClassManagement />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/student-detail/:id" element={<StudentDetail />} />
          <Route path="/students/:id/assignments" element={<StudentAssignmentsPage />} />
          <Route path="/assignment-detail/:userId/:scheduleId/:date/:assignmentId" element={<AssignmentDetail />} />
          <Route path="/class-detail/:id" element={<ClassDetail />} />
          <Route path="/session-detail/:id/:date" element={<SessionDetail />} />
          <Route path="/syllabus" element={<SyllabusManagement />} />
          <Route path="/syllabus-detail/:id" element={<SyllabusDetail />} />
          <Route path="/income" element={<IncomeManagement />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />

          {/* Student */}
          <Route path="/student-home" element={<StudentHome />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-schedule" element={<StudentSchedule />} />
          <Route path="/student-syllabus" element={<StudentSyllabus />} />
          <Route path="/parent-payment" element={<ParentPayment />} />
          <Route path="/student/session-detail/:id/:date" element={<StudentSessionDetail />} />
          <Route path="/student/syllabus/:id" element={<SyllabusPreview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
