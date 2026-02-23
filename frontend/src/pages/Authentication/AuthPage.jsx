// src/pages/Authentication/AuthPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import './css/AuthPage.css';

// Bạn có thể dùng icon từ react-icons hoặc font-awesome
// Ở đây mình dùng react-icons làm ví dụ (cài đặt: npm install react-icons)
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthPage = () => {
  const { mode = 'login' } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const isRegister = mode === 'register';
  const [rightPanelActive, setRightPanelActive] = useState(isRegister);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRightPanelActive(isRegister);
    }, 50);
    return () => clearTimeout(timer);
  }, [isRegister]);

  // Login
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',          // ← thêm trường này
    phone: '',
    roleNames: 'STUDENT',
  });
  const [registerError, setRegisterError] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await api.post('/auth/login', loginData);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    // Kiểm tra mật khẩu khớp nhau
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        roleNames: [registerData.roleNames],
      });
      alert(res.data.message || 'Đăng ký thành công! Kiểm tra email.');
      navigate('/verify-email');
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className={`container ${rightPanelActive ? 'right-panel-active' : ''}`}>
      {/* ================== FORM ĐĂNG NHẬP ================== */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleLoginSubmit}>
          <h1>Đăng Nhập</h1>
          <div className="social-container">
            <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="social"><i className="fab fa-google"></i></a>
            <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
          </div>
          <span>hoặc sử dụng tài khoản của bạn</span>

          {loginError && <p className="error-message">{loginError}</p>}

          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
          />

          <div className="relative password-field">
            <input
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
            >
              {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <a href="/forgot-password">Quên mật khẩu?</a>
          <button type="submit">Đăng Nhập</button>
        </form>
      </div>

      {/* ================== FORM ĐĂNG KÝ ================== */}
      <div className="form-container sign-up-container">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Tạo Tài Khoản</h1>
          <div className="social-container">
            <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="social"><i className="fab fa-google"></i></a>
            <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
          </div>
          <span>hoặc sử dụng email để đăng ký</span>

          {registerError && <p className="error-message">{registerError}</p>}

          <input
            placeholder="Họ và tên"
            value={registerData.full_name}
            onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            required
          />

          <div className="relative password-field">
            <input
              type={showRegisterPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
            >
              {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="relative password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <input
            placeholder="Số điện thoại (tùy chọn)"
            value={registerData.phone}
            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
          />

          <select
            value={registerData.roleNames}
            onChange={(e) => setRegisterData({ ...registerData, roleNames: e.target.value })}
          >
            <option value="STUDENT">Học sinh / Phụ huynh</option>
            <option value="TUTOR">Gia sư / Giáo viên</option>
          </select>

          <button type="submit">Đăng Ký</button>
        </form>
      </div>

      {/* Overlay giữ nguyên */}
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
                navigate('/auth/login', { replace: true });
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
                navigate('/auth/register', { replace: true });
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