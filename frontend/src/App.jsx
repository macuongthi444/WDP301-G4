// src/App.jsx (hoặc App.js)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Components
import Header from './components/Header'; // Header tinh giản của bạn

// Pages
import HomePage from './pages/Home/Homepage';

// Auth Pages (khớp với backend router)
import LoginPage from './pages/Authentication/Login'; // Đăng nhập (POST /auth/login)
import RegisterPage from './pages/Authentication/Register.jsx'; // Đăng ký (POST /auth/register)
// import VerifyEmailPage from './pages/Authentication/VerifyEmail.jsx'; // Xác thực OTP email (POST /auth/verify-email)
// import ForgotPasswordPage from './pages/Authentication/ForgotPassword.jsx'; // Quên mật khẩu (POST /auth/forgot-password)
// import ResetPasswordPage from './pages/Authentication/ResetPassword.jsx'; // Đặt lại mật khẩu (POST /auth/reset-password)

// // Dashboard (tùy role sau khi login thành công)
// import AdminDashboard from './pages/Admin/AdminDashboard'; // /admin

// Các page khác (comment nếu chưa có)

const noHeaderPaths = [
    "/register",
    "/login",
    "/admin",
    "/forgot-password",
    "/reset-password",
    
  ];
 const noHeaderPage =
    noHeaderPaths.includes(location.pathname) ||
    location.pathname.startsWith("/admin/");
  const noRedirectPaths = [
    "/login",
    "/register",
    "/admin",
    "/seller-dashboard",
    "/forgot-password",
    "/reset-password",
    
  ];
function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased flex flex-col">
      {/* Header hiển thị trên mọi trang */}
           {!noHeaderPage && <Header />}

      {/* Nội dung chính */}
      <main className="flex-grow">
        <Routes>
          {/* Trang chủ */}
          <Route path="/" element={<HomePage />} />

          {/* Auth Routes - khớp backend */}
          <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegisterPage />} />
          {/* <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />  */}

          {/* Dashboard theo role (sẽ redirect từ login) */}
          {/* <Route path="/admin" element={<AdminDashboard />} /> */}
         

          {/* Các route sản phẩm (thêm khi có page) */}
     
          {/* <Route path="/products/:id" element={<ProductDetail />} /> */}
          {/* <Route path="/cart" element={<CartPage />} /> */}

          {/* 404 */}
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

      {/* Footer tùy chọn */}
      {/* <footer className="bg-gray-800 text-white py-6 text-center mt-auto">
        © {new Date().getFullYear()} CloudCake
      </footer> */}
    </div>
  );
}

export default App;