import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ILLUSTRATION_SRC =
  'https://images.unsplash.com/photo-1614624892834-cd988fdc9c1b?auto=format&fit=crop&q=80&w=1200';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';
  const [formData, setFormData] = useState({
    email: prefilledEmail,
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) newErrors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.otp.trim()) newErrors.otp = 'Mã OTP không được để trống';
    if (!formData.newPassword) newErrors.newPassword = 'Mật khẩu mới không được để trống';
    else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      });
      toastSuccess('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Gradient background */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[260px] bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />

      <div className="mx-auto flex min-h-[100dvh] max-w-6xl items-center px-6 py-6">
        <div className="w-full">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </button>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="grid md:grid-cols-2">
              {/* Left illustration */}
              <div className="relative hidden md:block">
                <img
                  src={ILLUSTRATION_SRC}
                  alt="Reset Password"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-xl font-extrabold leading-snug">
                    Đặt lại mật khẩu của bạn
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Nhập mã OTP từ email và mật khẩu mới để hoàn thành quy trình.
                  </p>
                </div>
              </div>

              {/* Right form */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Đặt lại mật khẩu
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Nhập thông tin để đặt lại mật khẩu của bạn.
                    </p>
                  </div>
                  <div className="hidden sm:block rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Tutor Note
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm focus-within:ring-2 ${
                      errors.email
                        ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                        : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                    }`}>
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="name@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* OTP */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Mã OTP <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm focus-within:ring-2 ${
                      errors.otp
                        ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                        : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                    }`}>
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={formData.otp}
                        onChange={(e) =>
                          setFormData({ ...formData, otp: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Nhập mã OTP từ email"
                        required
                      />
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-xs text-red-600">{errors.otp}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm focus-within:ring-2 ${
                      errors.newPassword
                        ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                        : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                    }`}>
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, newPassword: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Nhập mật khẩu mới"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm focus-within:ring-2 ${
                      errors.confirmPassword
                        ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                        : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                    }`}>
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Xác nhận mật khẩu"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Đang xử lý...
                        </span>
                      ) : (
                        'Đặt lại mật khẩu'
                      )}
                    </button>

                    <p className="mt-4 text-center text-sm text-slate-600">
                      Nhớ mật khẩu rồi?{' '}
                      <Link
                        to="/login"
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Quay lại đăng nhập
                      </Link>
                    </p>

                    <p className="mt-2 text-center text-sm text-slate-600">
                      Chưa có tài khoản?{' '}
                      <Link
                        to="/register"
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Tutor Note
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;