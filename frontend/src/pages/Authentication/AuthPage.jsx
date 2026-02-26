// src/pages/Authentication/AuthPage.jsx
import { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./css/AuthPage.css";

const AuthPage = () => {
  const { mode = "login" } = useParams();
  const navigate = useNavigate();
  const { login, setPendingEmail } = useContext(AuthContext);

  const isRegister = mode === "register";
  const [rightPanelActive, setRightPanelActive] = useState(isRegister);

  // Login states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register states
  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    roleNames: "STUDENT",
  });
  const [registerError, setRegisterError] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true); // Bật loading

    try {
      const res = await api.post("/auth/login", loginData);
      const { token, user } = res.data;

      login(token, user);

      const role = user.roles?.[0] || "STUDENT";
      if (role === "TUTOR") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/student-dashboard", { replace: true });
      }
    } catch (err) {
      setLoginError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại.",
      );
    } finally {
      setIsLoginLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegisterLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Mật khẩu nhập lại không khớp");
      setIsRegisterLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        roleNames: [registerData.roleNames],
      });

      // Lưu email để verify không cần nhập lại
      setPendingEmail(registerData.email);

      alert(
        res.data.message ||
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
      );

      // Reset form
      setRegisterData({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        roleNames: "STUDENT",
      });

      navigate("/verify-email", { replace: true });
    } catch (err) {
      setRegisterError(
        err.response?.data?.message ||
          "Đăng ký thất bại. Email có thể đã tồn tại.",
      );
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div
      className={`container ${rightPanelActive ? "right-panel-active" : ""}`}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* FORM ĐĂNG NHẬP */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleLoginSubmit}>
          <h1>Đăng Nhập</h1>

          {loginError && <p className="error-message">{loginError}</p>}

          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            required
            disabled={isLoginLoading}
          />

          <input
            type={showLoginPass ? "text" : "password"}
            placeholder="Mật khẩu"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            required
            disabled={isLoginLoading}
          />

          <div className="checkbox-container">
            <label>
              <input
                type="checkbox"
                checked={showLoginPass}
                onChange={() => setShowLoginPass(!showLoginPass)}
                disabled={isLoginLoading}
              />
              Hiển thị mật khẩu
            </label>
          </div>

          <a href="/forgot-password">Quên mật khẩu?</a>

          <button
            type="submit"
            disabled={isLoginLoading}
            className={isLoginLoading ? "opacity-70 cursor-not-allowed" : ""}
          >
            {isLoginLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>
      </div>

      {/* FORM ĐĂNG KÝ */}
      <div className="form-container sign-up-container">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Tạo Tài Khoản</h1>

          {registerError && <p className="error-message">{registerError}</p>}

          <input
            placeholder="Họ và tên"
            value={registerData.full_name}
            onChange={(e) =>
              setRegisterData({ ...registerData, full_name: e.target.value })
            }
            required
            disabled={isRegisterLoading}
          />

          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) =>
              setRegisterData({ ...registerData, email: e.target.value })
            }
            required
            disabled={isRegisterLoading}
          />

          <input
            type={showRegPass ? "text" : "password"}
            placeholder="Mật khẩu"
            value={registerData.password}
            onChange={(e) =>
              setRegisterData({ ...registerData, password: e.target.value })
            }
            required
            disabled={isRegisterLoading}
          />

          <input
            type={showRegPass ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            value={registerData.confirmPassword}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                confirmPassword: e.target.value,
              })
            }
            required
            disabled={isRegisterLoading}
          />

          <div className="checkbox-container">
            <label>
              <input
                type="checkbox"
                checked={showRegPass}
                onChange={() => setShowRegPass(!showRegPass)}
                disabled={isRegisterLoading}
              />
              Hiển thị mật khẩu
            </label>
          </div>

          <input
            placeholder="Số điện thoại (tùy chọn)"
            value={registerData.phone}
            onChange={(e) =>
              setRegisterData({ ...registerData, phone: e.target.value })
            }
            disabled={isRegisterLoading}
          />

          <select
            value={registerData.roleNames}
            onChange={(e) =>
              setRegisterData({ ...registerData, roleNames: e.target.value })
            }
            disabled={isRegisterLoading}
          >
            <option value="STUDENT">Học sinh / Phụ huynh</option>
            <option value="TUTOR">Gia sư / Giáo viên</option>
          </select>

          <button
            type="submit"
            disabled={isRegisterLoading}
            className={isRegisterLoading ? "opacity-70 cursor-not-allowed" : ""}
          >
            {isRegisterLoading ? "Đang đăng ký..." : "Đăng Ký"}
          </button>
        </form>
      </div>

      {/* Overlay */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1 className="white-text">Chào mừng trở lại!</h1>
            <p>Để tiếp tục hành trình học tập, hãy đăng nhập</p>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setRightPanelActive(false);
                navigate("/auth/login", { replace: true });
              }}
            >
              Đăng Nhập
            </button>
          </div>

          <div className="overlay-panel overlay-right">
            <h1 className="white-text">Xin chào bạn mới!</h1>
            <p>Đăng ký ngay để trải nghiệm nền tảng học tập</p>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setRightPanelActive(true);
                navigate("/auth/register", { replace: true });
              }}
            >
              Đăng Ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
