// App.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

// Import component gộp (tạo mới hoặc sửa AuthLayout thành AuthPage)
import AuthLayout from './pages/Authentication/AuthPage';  // ← component mới gộp login + register
import VerifyEmail from './pages/Authentication/VerifyEmail';
import ForgotPassword from './pages/Authentication/ForgotPassword';
import ResetPassword from './pages/Authentication/ResetPassword';
import Dashboard from './pages/Admin/Dashboard';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public - Auth gộp login + register */}
        <Route
          path="/auth/:mode?"
          element={
            !user ? <AuthLayout /> : <Navigate to="/dashboard" replace />
          }
        />
        {/* Redirect /auth về login mặc định */}
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/auth/login" replace />}
        />

        {/* Root */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/auth/login"} replace />}
        />

        <Route path="*" element={<div className="p-10 text-center text-2xl">404 - Không tìm thấy trang</div>} />
      </Routes>
    </div>
  );
}

export default App;