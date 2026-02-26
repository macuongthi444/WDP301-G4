import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toastError } from '../../utils/toast'; // giữ nếu dùng
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, login, userRoles, hasRole } = useAuth();

  // Redirect nếu đã login
  useEffect(() => {
    if (isLoggedIn) {
      redirectBasedOnRole();
    }
  }, [isLoggedIn]);

  const redirectBasedOnRole = () => {
    const roles = userRoles || [];

    // Kiểm tra role tutor (backend trả "TUTOR" hoặc "ROLE_TUTOR")
    if (hasRole?.('TUTOR') || hasRole?.('tutor') || 
        roles.some(r => String(r).toUpperCase().includes('TUTOR'))) {
      navigate('/tutor');          
    }

    if (hasRole?.('ADMIN') || roles.some(r => String(r).toUpperCase().includes('ADMIN'))) {
      navigate('/admin');
      return;
    }

    navigate('/');
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;

      login(token, user);                    // ← Phải truyền cả token + user
      redirectBasedOnRole();                 // Redirect ngay sau login

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMsg);
      toastError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-blue-100 to-cream-100">
      {/* Left side - Decorative */}
      <div className="w-5/12 bg-blue-300 flex items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold leading-tight font-playfair">
            Tutor<br />Note Web<br />Welcome Back
          </h1>
        </div>
        {/* Nếu có ảnh decorative thì thêm src thật */}
        {/* <img src="..." alt="Decorative" className="absolute right-0 bottom-0 h-auto opacity-80" /> */}
      </div>

      {/* Right side - Login Form */}
      <div className="w-7/12 flex items-center justify-center bg-cream-50">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-pink-600 mb-8 font-playfair">
            Đăng nhập
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="relative">
              <input
                type="email"
                name="email"
                id="email"
                placeholder=" "
                className="peer w-full px-3 py-3 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition-all duration-300"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
              <label
                htmlFor="email"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.email ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' : 'top-3 text-base'}`}
              >
                Email <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Password field */}
            <div className="relative">
              <div className={`flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-pink-400 transition-all duration-300
                ${error ? 'border-red-500' : 'border-pink-300'}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder=" "
                  className="peer flex-1 px-3 py-3 bg-cream-50 outline-none"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-gray-500 hover:text-pink-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <label
                htmlFor="password"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.password ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' : 'top-3 text-base'}`}
              >
                Mật khẩu <span className="text-red-500">*</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition transform hover:scale-105 flex items-center justify-center mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-t-pink-700 border-pink-200 rounded-full animate-spin"></div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2 text-sm">
            <a href="/forgot-password" className="text-pink-600 hover:underline block">
              Quên mật khẩu?
            </a>
            <a href="/register" className="text-pink-600 hover:underline block">
              Tạo tài khoản mới
            </a>
            <a href="/" className="text-pink-600 hover:underline block">
              Về trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;