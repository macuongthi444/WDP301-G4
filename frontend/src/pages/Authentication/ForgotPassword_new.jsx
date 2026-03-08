import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Mail, ArrowLeft } from 'lucide-react';

// Illustration for forgot password page
const ILLUSTRATION_SRC =
  'https://images.unsplash.com/photo-1526374965328-7f5ae4e8a41f?auto=format&fit=crop&q=80&w=1200';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email không được để trống');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmedEmail });
      toastSuccess('Mã OTP đã được gửi đến email của bạn');
      navigate('/reset-password', { state: { email: trimmedEmail } });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
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
                  alt="Forgot Password"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-xl font-extrabold leading-snug">
                    Đặt lại mật khẩu của bạn
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Chúng tôi sẽ gửi mã xác minh đến email của bạn để đặt lại mật khẩu.
                  </p>
                </div>
              </div>

              {/* Right form */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Quên mật khẩu?
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Nhập email để nhận mã xác minh.
                    </p>
                  </div>
                  <div className="hidden sm:block rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Tutor Note
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                  {/* Email field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={handleChange}
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="name@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
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
                          Đang gửi...
                        </span>
                      ) : (
                        'Gửi mã OTP'
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

export default ForgotPasswordPage;
