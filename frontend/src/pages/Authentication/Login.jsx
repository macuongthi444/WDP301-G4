import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toastError } from "../../utils/toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

// ✅ Nếu bạn để ảnh trong src/assets, dùng kiểu này:
// import ILLUSTRATION_SRC from "../../assets/login-illustration.png";
const ILLUSTRATION_SRC =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, login, userRoles, hasRole } = useAuth();

  useEffect(() => {
    if (isLoggedIn) redirectBasedOnRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const redirectBasedOnRole = () => {
    const roles = userRoles || [];

    // Tutor
    if (
      hasRole?.("TUTOR") ||
      hasRole?.("tutor") ||
      roles.some((r) => String(r).toUpperCase().includes("TUTOR"))
    ) {
      navigate("/tutor");
      return;
    }

    // Admin
    if (
      hasRole?.("ADMIN") ||
      roles.some((r) => String(r).toUpperCase().includes("ADMIN"))
    ) {
      navigate("/admin");
      return;
    }
    if (
      hasRole?.("STUDENT") ||
      hasRole?.("student") ||
      roles.some(r => r.includes("STUDENT"))
    ) 
    {
      navigate("/student");       
      return;
    }

    navigate("/");  
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;

      login(token, user); // giữ nguyên
      redirectBasedOnRole();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMsg);
      toastError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Đang chuyển hướng...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background */}
      <div className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="h-[520px] bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />
          <div className="h-[calc(100vh-520px)] bg-white" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Top back */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/")}
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
                  alt="Illustration"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/50" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="text-2xl font-extrabold leading-tight">
                    Kết nối gia sư, học sinh & phụ huynh
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Điểm danh, ghi chú, thông báo tự động — tất cả trong một nền tảng.
                  </p>
                </div>
              </div>

              {/* Right form */}
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">
                      Đăng nhập
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Chào mừng bạn quay lại 👋
                    </p>
                  </div>
                  <div className="hidden sm:block rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Tutor Note
                  </div>
                </div>

                {error && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="name@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Quên mật khẩu?
                    </Link>
                    <Link
                      to="/register"
                      className="font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Tạo tài khoản
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang đăng nhập...
                      </span>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>

                  <p className="pt-2 text-center text-sm text-slate-600">
                    Chưa có tài khoản?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Small footer */}
          <div className="mt-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Tutor Note
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;