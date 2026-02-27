import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toastSuccess, toastError } from "../../utils/toast";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";

// ✅ Nếu bạn để ảnh trong src/assets:
// import ILLUSTRATION_SRC from "../../assets/register-illustration.png";
const ILLUSTRATION_SRC =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200";

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

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    if (!touched[name]) setTouched((p) => ({ ...p, [name]: true }));
    if (name === "password") validatePasswordStrength(value);

    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
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
    else if (score === 2) message = "TB";
    else if (score === 3) message = "Khá";
    else if (score === 4) message = "Mạnh";

    setPasswordStrength({ score, message });
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case "fullName":
        if (!value.trim()) newErrors.fullName = "Họ và tên không được để trống";
        else delete newErrors.fullName;
        break;

      case "email":
        if (!value.trim()) newErrors.email = "Email không được để trống";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          newErrors.email = "Email không hợp lệ";
        else delete newErrors.email;
        break;

      case "password":
        if (!value) newErrors.password = "Mật khẩu không được để trống";
        else if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(value))
          newErrors.password = "Tối thiểu 8 ký tự, gồm chữ và số";
        else delete newErrors.password;
        break;

      case "confirmPassword":
        if (value !== formData.password)
          newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        else delete newErrors.confirmPassword;
        break;

      case "phone":
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
    let newTouched = {};

    ["fullName", "email", "password", "confirmPassword"].forEach((key) => {
      newTouched[key] = true;
      if (!validateField(key, formData[key])) isValid = false;
    });

    if (formData.phone.trim()) {
      newTouched.phone = true;
      if (!validateField("phone", formData.phone)) isValid = false;
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
      if (formData.phone.trim()) payload.phone = formData.phone.trim();

      await api.post("/auth/register", payload);

      toastSuccess("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      navigate("/verify-email");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";

      if (errorMsg.includes("email") && errorMsg.includes("exists")) {
        setErrors((p) => ({ ...p, email: "Email đã được sử dụng" }));
      } else if (errorMsg.includes("phone")) {
        setErrors((p) => ({ ...p, phone: errorMsg }));
      } else {
        setGeneralError(errorMsg);
      }

      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    touched[name] && errors[name] ? (
      <p className="mt-1 text-[12px] text-red-600">{errors[name]}</p>
    ) : null;

  const strengthUI = () => {
    if (!touched.password || !formData.password) return null;
    const { score, message } = passwordStrength;
    const pct = Math.min(score * 25, 100);
    const barColor =
      score <= 1
        ? "bg-red-500"
        : score === 2
        ? "bg-yellow-500"
        : score === 3
        ? "bg-emerald-500"
        : "bg-emerald-600";

    return (
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-slate-600">{message}</span>
      </div>
    );
  };

  const inputWrap = (bad) =>
    `flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 ${
      bad ? "border-red-300 focus-within:ring-red-500" : "border-slate-200 focus-within:ring-indigo-500"
    }`;

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* nền compact: gradient nhỏ để khỏi kéo dài */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[260px] bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />

      <div className="mx-auto flex min-h-[100dvh] max-w-6xl items-center px-6 py-6">
        <div className="w-full">
          {/* back */}
          <div className="mb-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </button>
          </div>

          {/* card */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="grid md:grid-cols-2">
              {/* left illustration (không tăng chiều cao) */}
              <div className="relative hidden md:block">
                <img src={ILLUSTRATION_SRC} alt="Illustration" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-xl font-extrabold leading-snug">
                    Tạo tài khoản để quản lý buổi học dễ dàng
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Điểm danh • Thông báo phụ huynh • AI tạo bài tập
                  </p>
                </div>
              </div>

              {/* form */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Đăng ký tài khoản
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Hoàn tất trong 1 phút.
                    </p>
                  </div>
                  <div className="hidden sm:block rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Tutor Note
                  </div>
                </div>

                {generalError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {generalError}
                  </div>
                )}

                {/* spacing gọn lại: space-y-4 */}
                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                  {/* Row 1: Name + Phone */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className={inputWrap(touched.fullName && errors.fullName)}>
                        <User className="h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <FieldError name="fullName" />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Số điện thoại <span className="text-slate-400">(tùy chọn)</span>
                      </label>
                      <div className={inputWrap(touched.phone && errors.phone)}>
                        <Phone className="h-5 w-5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                          placeholder="0912345678"
                        />
                      </div>
                      <FieldError name="phone" />
                    </div>
                  </div>

                  {/* Email full width */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className={inputWrap(touched.email && errors.email)}>
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        placeholder="name@email.com"
                        required
                      />
                    </div>
                    <FieldError name="email" />
                  </div>

                  {/* Row 2: Password + Confirm */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className={inputWrap(touched.password && errors.password)}>
                        <Lock className="h-5 w-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                          placeholder="Ít nhất 8 ký tự"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {strengthUI()}
                      <FieldError name="password" />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className={inputWrap(touched.confirmPassword && errors.confirmPassword)}>
                        <Lock className="h-5 w-5 text-slate-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                          placeholder="Nhập lại"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FieldError name="confirmPassword" />
                    </div>
                  </div>

                  {/* submit + link */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Đang tạo tài khoản...
                        </span>
                      ) : (
                        "Đăng ký"
                      )}
                    </button>

                    <p className="mt-3 text-center text-sm text-slate-600">
                      Đã có tài khoản?{" "}
                      <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Đăng nhập ngay
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

export default RegisterPage;