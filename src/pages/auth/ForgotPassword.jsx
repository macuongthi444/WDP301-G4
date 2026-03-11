import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ValidationUtils } from '../../utils/ValidationUtils';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'done'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!ValidationUtils.validateEmail(email)) {
      setError("Email không đúng định dạng!");
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Firebase's built-in email reset link function
      await sendPasswordResetEmail(auth, email);
      setStep('done');
    } catch (error) {
      console.error("Send reset email failed:", error);
      if (error.code === 'auth/user-not-found') {
        setError("Email này chưa được đăng ký trong hệ thống.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Email không hợp lệ.");
      } else {
        setError("Đã có lỗi xảy ra: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0f2f5] h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-800 overflow-hidden">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[1100px] flex flex-col md:flex-row overflow-hidden h-full max-h-[720px] relative">

        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-6 lg:p-10 flex flex-col justify-center relative z-10 bg-white h-full">
          <div className="w-full max-w-[380px] mx-auto">

            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold mb-3 w-fit flex items-center gap-2 group transition-all">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <i className="fa-solid fa-arrow-left text-sm"></i>
              </div>
              Quay lại đăng nhập
            </Link>

            {step === 'email' && (
              <>
                <div className="mb-6 flex flex-col items-center md:items-start">
                  <img src="/logo.svg" alt="Sổ tay Gia sư" className="w-16 h-16 mb-4" />
                  <h1 className="text-[1.6rem] font-black text-slate-900 mb-1 uppercase tracking-tight leading-tight">Quên mật<br/>khẩu?</h1>
                  <p className="text-slate-500 text-xs font-medium">Nhập Email đã đăng ký, chúng tôi sẽ gửi một liên kết để bạn đặt lại mật khẩu mới an toàn.</p>
                </div>
                <form className="space-y-3" onSubmit={handleResetPassword}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fa-regular fa-envelope text-slate-400"></i>
                    </div>
                    <input type="email" placeholder="Địa chỉ Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-[#f4f3fb] border ${error ? 'border-red-500' : 'border-transparent'} rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`} required />
                  </div>
                  {error && <p className="text-[11px] text-red-500 ml-1 font-bold">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#7ae8c7] to-[#86a8ff] text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(134,168,255,0.3)] hover:shadow-[0_10px_25px_rgba(134,168,255,0.4)] hover:-translate-y-0.5 transition-all outline-none mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? 'Đang gửi link...' : 'Gửi link khôi phục'}
                  </button>
                </form>
              </>
            )}

            {step === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mt-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-paper-plane text-green-500 text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Đã gửi email khôi phục!</h3>
                <p className="text-sm text-slate-500 mb-6">Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư mục rác) của bạn.</p>
                <Link to="/login" className="inline-block w-full bg-gradient-to-r from-[#7ae8c7] to-[#86a8ff] text-white font-bold py-3 px-8 rounded-xl shadow-[0_8px_20px_rgba(134,168,255,0.3)] hover:-translate-y-0.5 transition-all">
                  Quay lại đăng nhập
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Graphic */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#ec4899] relative items-center justify-center p-8 overflow-hidden z-0">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg viewBox="0 0 800 800" className="w-full h-full scale-150 transform">
              <circle cx="100" cy="100" r="20" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="200" cy="500" r="300" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="600" cy="200" r="400" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="700" cy="800" r="350" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative z-10 w-[420px] h-[450px] bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl overflow-hidden border border-white/20">
            <h2 className="text-white text-[1.6rem] font-bold leading-[1.3] w-[75%] relative z-20">
              <span className="text-yellow-200 font-black">Khôi phục an toàn</span><br/>
              Bạn có thể khôi phục lại mật khẩu thông qua Email đăng ký.
            </h2>
            <img src="/assent/women with tab 1.png" alt="Teacher holding tablet" className="absolute -bottom-2 -right-14 h-[350px] object-contain object-bottom drop-shadow-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
