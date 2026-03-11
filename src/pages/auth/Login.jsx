import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ValidationUtils } from '../../utils/ValidationUtils';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateEmail(email)) newErrors.email = 'Email không đúng định dạng';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Save role to localStorage for app-wide use
      localStorage.setItem('activeRole', user.role);
      
      setLoading(false);
      if (user.role === 'tutor') {
        navigate('/dashboard');
      } else {
        navigate('/role-selection');
      }
    } catch (error) {
      setLoading(false);
      setErrors({ form: error.message || 'Đăng nhập thất bại' });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      
      localStorage.setItem('activeRole', user.role || 'tutor');
      
      setLoading(false);
      if (user.role === 'tutor') {
        navigate('/dashboard');
      } else {
        navigate('/role-selection');
      }
    } catch (error) {
      setLoading(false);
      alert("Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-800">

      {/* Main Container */}
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[1100px] flex flex-col md:flex-row overflow-hidden min-h-[500px] md:h-[720px] relative">

        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-6 lg:p-10 flex flex-col justify-center relative z-10 bg-white overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[380px] mx-auto">

            <Link to="/" className="text-blue-500 hover:text-blue-600 font-semibold mb-3 w-fit flex items-center gap-2 group transition-all">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <i className="fa-solid fa-arrow-left text-sm"></i>
              </div>
              Về trang chủ
            </Link>

            <div className="mb-6 flex flex-col items-center md:items-start">
              <img src="/logo.svg" alt="Sổ tay Gia sư" className="w-16 h-16 mb-4" />
              <h1 className="text-[1.6rem] font-black text-slate-900 mb-1 uppercase tracking-tight leading-tight">Chào mừng<br/>trở lại!</h1>
              <p className="text-slate-500 text-xs font-medium">Vui lòng đăng nhập để quản lý lớp học của bạn.</p>
            </div>

            {/* Form */}
            <form className="space-y-2.5" onSubmit={handleEmailLogin}>

              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-regular fa-envelope text-slate-400"></i>
                </div>
                <input type="email" placeholder="Địa chỉ email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-[#f4f3fb] border ${errors.email ? 'border-red-500' : 'border-transparent'} rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`} required />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.email}</p>}

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-slate-400"></i>
                </div>
                <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-[#f4f3fb] border ${errors.password ? 'border-red-500' : 'border-transparent'} rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`} required />
              </div>
              {errors.password && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.password}</p>}
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}


              {/* Forgot Password */}
              <div className="flex justify-end pt-1 pb-1">
                <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-blue-500 font-semibold transition-colors">Quên mật khẩu?</Link>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#7ae8c7] to-[#86a8ff] text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(134,168,255,0.3)] hover:shadow-[0_10px_25px_rgba(134,168,255,0.4)] hover:-translate-y-0.5 transition-all outline-none mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              {/* Divider */}
              <div className="flex items-center py-2">
                <div className="flex-grow h-px bg-slate-100"></div>
                <span className="px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Hoặc tiếp tục với</span>
                <div className="flex-grow h-px bg-slate-100"></div>
              </div>

              {/* Google Login */}
              <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border-2 border-slate-100 text-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all outline-none disabled:opacity-60">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

            </form>

            {/* Sign Up Link */}
            <p className="text-sm font-medium text-slate-500 text-center mt-4">
              Chưa có tài khoản? <Link to="/register" className="text-blue-500 font-bold hover:underline ml-1">Đăng ký</Link>
            </p>

          </div>
        </div>

        {/* Right Side: Graphic */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-[#2563ea] via-[#2ba5d4] to-[#4ef090] relative items-center justify-center p-8 overflow-hidden z-0">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg viewBox="0 0 800 800" className="w-full h-full scale-150 transform">
              <circle cx="100" cy="100" r="20" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="200" cy="500" r="300" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="600" cy="200" r="400" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="700" cy="800" r="350" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative z-10 w-[420px] h-[450px] bg-[#97d8e8]/30 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl overflow-hidden border border-white/20">
            <h2 className="text-white text-[1.6rem] font-bold leading-[1.3] w-[75%] relative z-20">
              <span className="text-[#ff4d4f] font-black">Sổ tay gia sư</span><br/>
              giúp gia sư và phụ huynh dễ dàng quản lý các con hơn
            </h2>
            <img src="/assent/women with tab 1.png" alt="Teacher holding tablet" className="absolute -bottom-2 -right-14 h-[350px] object-contain object-bottom drop-shadow-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="w-6 h-6">
                <path d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z" />
              </svg>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Login;
