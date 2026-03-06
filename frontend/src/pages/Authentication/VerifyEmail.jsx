import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { toastSuccess, toastError } from "../../utils/toast";
import { Mail, Key, ArrowLeft } from "lucide-react";

// Hình minh hoạ trang xác thực email (có thể thay đổi tuỳ ý)
const ILLUSTRATION_SRC =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=1200";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Lấy sẵn email từ state nếu được chuyển sang từ trang đăng ký
  const prefilledEmail = location.state?.email || "";
  const [formData, setFormData] = useState({ email: prefilledEmail, otp: "" });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra dữ liệu trước khi gửi
  const validate = () => {
    const newErrors = {};
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) newErrors.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.otp.trim()) newErrors.otp = "Mã OTP không được để trống";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/auth/verify-email", {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });
      toastSuccess(
        "Xác thực email thành công. Vui lòng chờ admin duyệt để kích hoạt tài khoản."
      );
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nền gradient */}
      <div className="relative">
        <div className="absolute inset-0 -z-10">
          {/* Gradient 520px như các trang đăng nhập/đặt lại */}
          <div className="h-[520px] bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />
          <div className="h-[calc(100vh-520px)] bg-white" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Link quay lại */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Về đăng ký
            </button>
          </div>

          {/* Thẻ */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="grid md:grid-cols-2">
              {/* Hình minh hoạ */}
              <div className="relative hidden md:block">
                <img
                  src={ILLUSTRATION_SRC}
                  alt="Verify email illustration"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/50" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="text-2xl font-extrabold leading-tight">
                    Xác thực email
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Nhập mã OTP đã được gửi tới email của bạn để kích hoạt tài khoản.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="p-8 sm:p-10">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Xác thực email
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Vui lòng nhập email và mã OTP để xác thực tài khoản.
                  </p>
                </div>

                {(errorMessage || Object.values(errors).some((v) => v)) && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage || Object.values(errors).find(Boolean)}
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
                    {errors.email && (
                      <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* OTP */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Mã OTP <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                      <Key className="h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        name="otp"
                        id="otp"
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Nhập mã OTP"
                        value={formData.otp}
                        onChange={handleChange}
                        required
                        autoComplete="one-time-code"
                      />
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-[12px] text-red-600">{errors.otp}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang xác thực...
                      </span>
                    ) : (
                      "Xác thực"
                    )}
                  </button>
                  <p className="pt-2 text-center text-sm text-slate-600">
                    Đã xác thực?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Đăng nhập
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Tutor Note
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;