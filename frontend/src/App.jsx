import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import ProtectedRoute from './route/ProtectedRoute';

// Components
import Header from './components/Header';

// Pages
import HomePage from './pages/Home/Homepage';
import LoginPage from './pages/Authentication/Login';
import RegisterPage from './pages/Authentication/Register';
//  import VerifyEmailPage from './pages/Authentication/VerifyEmail'
// import ForgotPasswordPage from ...
// import ResetPasswordPage from ...

import TutorLayout from './pages/Tutor/TutorLayout';

function App() {
  const location = useLocation();

  const hideHeaderPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
     '/verify-email',
  ];

  const shouldHideHeader = hideHeaderPaths.includes(location.pathname);

  return (
    
      <div className="min-h-screen bg-gray-50 font-sans antialiased flex flex-col">
        {!shouldHideHeader && <Header />}

        <main className="flex-grow">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* <Route path="/verify-email" element={<VerifyEmailPage />} /> */}
            {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
            {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}

            {/* Protected routes theo role */}
            <Route element={<ProtectedRoute allowedRoles={['TUTOR']} />}>
              <Route path="/tutor/*" element={<TutorLayout />} />
            </Route>

            {/* Ví dụ cho role khác (nếu có) */}
            {/* <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route> */}

            {/* Catch-all 404 */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                  <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Trang không tồn tại</p>
                  <a
                    href="/"
                    className="px-8 py-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                  >
                    Về trang chủ
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
   
  );
}

export default App;