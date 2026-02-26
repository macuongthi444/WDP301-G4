import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }

    if (name === 'password') {
      validatePasswordStrength(value);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validatePasswordStrength = (password) => {
    let score = 0;
    let message = "";

    if (!password) {
      setPasswordStrength({ score: 0, message: "" });
      return;
    }

    if (password.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score === 1) message = "Yếu";
    else if (score === 2) message = "Trung bình";
    else if (score === 3) message = "Khá mạnh";
    else if (score === 4) message = "Mạnh";

    setPasswordStrength({ score, message });
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'fullName':
        if (!value.trim()) newErrors.fullName = "Họ và tên không được để trống";
        else delete newErrors.fullName;
        break;

      case 'email':
        if (!value.trim()) newErrors.email = "Email không được để trống";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Email không hợp lệ";
        else delete newErrors.email;
        break;

      case 'password':
        if (!value) newErrors.password = "Mật khẩu không được để trống";
        else if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(value)) 
          newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số";
        else delete newErrors.password;
        break;

      case 'confirmPassword':
        if (value !== formData.password) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        else delete newErrors.confirmPassword;
        break;

      case 'phone':
        if (value.trim() && !/^(84|0[3-9])[0-9]{8,9}$/.test(value)) 
          newErrors.phone = "Số điện thoại không hợp lệ";
        else delete newErrors.phone;
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};
    let newTouched = {};

    ['fullName', 'email', 'password', 'confirmPassword'].forEach(key => {
      newTouched[key] = true;
      if (!validateField(key, formData[key])) isValid = false;
    });

    if (formData.phone.trim()) {
      newTouched.phone = true;
      if (!validateField('phone', formData.phone)) isValid = false;
    }

    setTouched(newTouched);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      const response = await api.post('/auth/register', payload);

      toastSuccess("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      navigate("/verify-email");
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";

      if (errorMsg.includes("email") && errorMsg.includes("exists")) {
        setErrors(prev => ({ ...prev, email: "Email đã được sử dụng" }));
      } else if (errorMsg.includes("phone")) {
        setErrors(prev => ({ ...prev, phone: errorMsg }));
      } else {
        setGeneralError(errorMsg);
      }

      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrengthIndicator = () => {
    if (!touched.password || !formData.password) return null;

    const { score, message } = passwordStrength;
    let colorClass = "bg-gray-200";
    if (score === 1) colorClass = "bg-red-500";
    else if (score === 2) colorClass = "bg-yellow-500";
    else if (score === 3) colorClass = "bg-green-300";
    else if (score === 4) colorClass = "bg-green-500";

    return (
      <div className="mt-1">
        <div className="h-2 w-full bg-gray-200 rounded">
          <div className={`h-full ${colorClass} rounded`} style={{ width: `${score * 25}%` }}></div>
        </div>
        <p className="text-xs text-brown-600 mt-1">{message}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-pink-100 to-cream-100">
      {/* Left side */}
      <div className="w-5/12 bg-pink-300 flex items-center p-16 relative overflow-hidden animate__animated animate__fadeIn animate__slow">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold leading-tight font-playfair animate__animated animate__fadeInDown">
            Sweet Delights<br />
            Cake Shop<br />
            Join Us
          </h1>
        </div>
        <img
          src="https://www.marthastewart.com/thmb/I23am9WHQalDICEqnfOE94GDsxw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/brooke-shea-wedding-172-d111277_vert-2000-a9a8ab0ce65c4fcc8a2d47ef174eb56e.jpg"
          alt="Decorative cake"
          className="absolute right-0 bottom-0 h-auto opacity-80 animate__animated animate__zoomIn animate__delay-1s"
        />
      </div>

      {/* Right side - Form */}
      <div className="w-7/12 flex items-center justify-center bg-cream-50">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg animate__animated animate__slideInRight">
          <h2 className="text-3xl font-bold text-pink-600 mb-8 font-playfair animate__animated animate__fadeIn">
            Đăng ký tài khoản
          </h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate__animated animate__shakeX">
              {generalError}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="relative">
              <input
                type="text"
                name="fullName"
                id="fullName"
                placeholder=" "
                className={`peer w-full px-3 py-3 border ${touched.fullName && errors.fullName ? 'border-red-500' : 'border-pink-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition-all duration-300`}
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <label
                htmlFor="fullName"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.fullName || touched.fullName 
                    ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' 
                    : 'top-3 text-base'}`}
              >
                Họ và tên <span className="text-red-500">*</span>
              </label>
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                name="email"
                id="email"
                placeholder=" "
                className={`peer w-full px-3 py-3 border ${touched.email && errors.email ? 'border-red-500' : 'border-pink-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition-all duration-300`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.email || touched.email 
                    ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' 
                    : 'top-3 text-base'}`}
              >
                Email <span className="text-red-500">*</span>
              </label>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="relative">
              <input
                type="tel"
                name="phone"
                id="phone"
                placeholder=" "
                className={`peer w-full px-3 py-3 border ${touched.phone && errors.phone ? 'border-red-500' : 'border-pink-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition-all duration-300`}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <label
                htmlFor="phone"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.phone || touched.phone 
                    ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' 
                    : 'top-3 text-base'}`}
              >
                Số điện thoại (tùy chọn)
              </label>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
              <p className="text-xs text-brown-600 mt-1">Định dạng: 0912345678 hoặc 84912345678</p>
            </div>

            {/* Password */}
<div className="relative">
  <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-pink-400 transition-all duration-300
    ${touched.password && errors.password ? 'border-red-500' : 'border-pink-300'}">
    
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      id="password"
      placeholder=" "
      className="peer flex-1 px-3 py-3 bg-cream-50 outline-none"
      value={formData.password}
      onChange={handleChange}
      onBlur={handleBlur}
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
      ${formData.password || touched.password 
        ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' 
        : 'top-3 text-base'}`}
  >
    Mật khẩu <span className="text-red-500">*</span>
  </label>

  {renderPasswordStrengthIndicator()}
  <p className="text-xs text-brown-600 mt-1">
    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số
  </p>
  {touched.password && errors.password && (
    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
  )}
</div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                placeholder=" "
                className={`peer w-full px-3 py-3 border ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-pink-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition-all duration-300 pr-10`}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-3 transition-all duration-300 ease-in-out pointer-events-none text-brown-700
                  ${formData.confirmPassword || touched.confirmPassword 
                    ? 'top-[-10px] text-xs bg-white px-1 text-pink-600' 
                    : 'top-3 text-base'}`}
              >
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition transform hover:scale-105 animate__animated animate__pulse animate__infinite animate__slow flex items-center justify-center mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-t-pink-700 border-pink-200 rounded-full animate-spin"></div>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700">
              Bạn đã có tài khoản? Đăng nhập ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;