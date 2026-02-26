// src/route/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isLoggedIn, userRoles = [], loading } = useAuth(); // ← default [] để tránh crash

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Đang xác thực...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Nếu không yêu cầu role cụ thể → cho qua luôn
  if (allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Chuẩn hóa roles từ user và allowed
  const userUpperRoles = userRoles.map(role => String(role).toUpperCase());
  const allowedUpper = allowedRoles.map(role => String(role).toUpperCase());

  // Check chính xác hơn: match toàn bộ hoặc có prefix ROLE_
  const hasRequiredRole = allowedUpper.some(allowed => 
    userUpperRoles.includes(allowed) ||
    userUpperRoles.includes(`ROLE_${allowed}`)
  );

  if (!hasRequiredRole) {
    console.warn("Access denied - insufficient role", {
      userRoles: userUpperRoles,
      required: allowedUpper,
    });

    // Có thể tùy chỉnh redirect theo ngữ cảnh (nếu cần)
    // Ví dụ: nếu allowed có TUTOR → redirect về /tutor thay vì /
    const isTutorRoute = allowedUpper.includes('TUTOR') || allowedUpper.includes('ROLE_TUTOR');
    return <Navigate to={isTutorRoute ? '/tutor' : '/'} replace />;
  }

  return <Outlet />;
}