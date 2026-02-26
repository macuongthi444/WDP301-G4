import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toastSuccess, toastError } from '../../utils/toast'; // nếu có
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { isLoggedIn, login, userRoles } = useAuth();

  // Redirect nếu đã login
  const redirectBasedOnRole = (roles = []) => {
    console.log("Redirecting based on roles:", roles);
    let redirectPath = "/";
    if (!Array.isArray(roles)) roles = [];

    const hasAdminRole = roles.some(
      (role) =>
        typeof role === "string" &&
        (role.toUpperCase() === "ROLE_ADMIN" || role.toUpperCase() === "ADMIN")
    );
    const hasSellerRole = roles.some(
      (role) =>
        typeof role === "string" &&
        (role.toUpperCase() === "ROLE_SELLER" || role.toUpperCase() === "SELLER")
    );

    if (hasAdminRole) redirectPath = "/admin";
    else if (hasSellerRole) redirectPath = "/seller";

    navigate(redirectPath);
  };

  useEffect(() => {
    if (isLoggedIn && userRoles) {
      redirectBasedOnRole(userRoles);
    }
  }, [isLoggedIn, userRoles, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      login(user);

      redirectBasedOnRole(user.roles || []);
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.";
      setError(errorMsg);
      toastError(errorMsg); // nếu dùng toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-blue-100 to-cream-100">
      {/* Left side - Decorative */}
      <div className="w-5/12 bg-blue-300 flex items-center p-16 relative overflow-hidden animate__animated animate__fadeIn animate__slow">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold leading-tight font-playfair animate__animated animate__fadeInDown">
            Tutor<br />
            Note Web<br />
            Welcome Back
          </h1>
        </div>
        <img
          src="" // Thay bằng ảnh thật nếu có
          alt="Decorative"
          className="absolute right-0 bottom-0 h-auto opacity-80"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-7/12 flex items-center justify-center bg-cream-50">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg animate__animated animate__slideInRight">
          <h2 className="text-3xl font-bold text-pink-600 mb-8 font-playfair animate__animated animate__fadeIn">
            Đăng nhập
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate__animated animate__shakeX">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Email */}
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
              />
              <label
                htmlFor="email"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.email ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' : 'top-3 text-base'}`}
              >
                Email <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-pink-400 transition-all duration-300
                ${error ? 'border-red-500' : 'border-pink-300'}">
                
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder=" "
                  className="peer flex-1 px-3 py-3 bg-cream-50 outline-none"
                  value={formData.password}
                  onChange={handleChange}
                  required
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
              className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition transform hover:scale-105 animate__animated animate__pulse animate__infinite animate__slow flex items-center justify-center mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-t-pink-700 border-pink-200 rounded-full animate-spin"></div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Links dưới form */}
          <div className="mt-6 text-center space-y-2">
            <a
              href="/forgot-password"
              className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700"
            >
              Quên mật khẩu?
            </a>
            <div>
              <a
                href="/register"
                className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700"
              >
                Tạo tài khoản mới
              </a>
            </div>
            <div>
              <a
                href="/"
                className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700"
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;