// src/App.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import { ClassProvider } from "./context/ClassContext";

import AuthLayout from "./pages/Authentication/AuthPage";
import VerifyEmail from "./pages/Authentication/VerifyEmail";
import ForgotPassword from "./pages/Authentication/ForgotPassword";
import ResetPassword from "./pages/Authentication/ResetPassword";
import Dashboard from "./pages/Home/DashboardTutor"; // Trang tutor dashboard
import GuestHome from "./pages/Home/GuestHome";

// import './App.css';

// Layout chung cho tutor (sidebar + header)
// import MainLayout from './components/layout/MainLayout';

// Placeholder student
const StudentDashboard = () => <div>Trang học viên (đang phát triển)</div>;

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;

    // Nếu chưa đăng nhập: chỉ chặn các trang cần auth
    if (!user) {
      const protectedPrefixes = ["/dashboard", "/classes"];
      const isProtected = protectedPrefixes.some((p) => path.startsWith(p));
      if (isProtected) navigate("/auth/login", { replace: true });
      return;
    }

    // Nếu đã đăng nhập: điều hướng theo role khi ở trang guest/auth
    const isGuestOrAuth =
      path === "/" ||
      path.startsWith("/auth") ||
      path === "/verify-email" ||
      path === "/forgot-password" ||
      path === "/reset-password";

    if (user.roles?.includes("TUTOR")) {
      if (isGuestOrAuth) navigate("/dashboard", { replace: true });
    } else if (user.roles?.includes("STUDENT")) {
      if (isGuestOrAuth) navigate("/student-dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<GuestHome />} />
      <Route path="/auth/:mode?" element={<AuthLayout />} />
      <Route path="/auth" element={<AuthLayout />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Tutor */}
      {user && user.roles?.includes("TUTOR") && (
        <Route
          element={
            <ClassProvider>
              <MainLayout />
            </ClassProvider>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/classes/:classId/*" element={<ClassDetailLayout />} /> */}
        </Route>
      )}

      {/* Student */}
      {user && user.roles?.includes("STUDENT") && (
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      )}

      {/* Root */}
      <Route path="*" element={<div>404 - Không tìm thấy</div>} />
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App;
