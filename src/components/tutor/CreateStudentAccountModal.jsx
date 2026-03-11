import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function CreateStudentAccountModal({ isOpen, onClose, userId, studentId, studentName }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateEmail(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!ValidationUtils.validatePassword(formData.password)) newErrors.password = 'Mật khẩu phải từ 6 ký tự';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: studentName || 'Học sinh',
        phone: '',
        tutorId: userId,
        studentId: studentId
      };
      const response = await fetch('https://asia-southeast1-tutor-note-6e8b1.cloudfunctions.net/createStudentAuth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      onClose();
      setErrors({});
      alert('Tạo tài khoản học viên thành công! Hãy gửi tên đăng nhập và mật khẩu này cho Phụ huynh.');
    } catch (error) {
      setErrors({ form: 'Lỗi tạo tài khoản: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-8 pb-4 text-center">
            <h2 className="text-[24px] font-black text-slate-800">Cấp Tài Khoản Mới</h2>
            <p className="text-[13px] text-slate-500 mt-2 font-medium">Tài khoản này dùng để đăng nhập xem Lịch học và Bài tập.</p>
          </div>

          <div className="p-8 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Tên Đăng Nhập (Email Phụ Huynh)*</label>
              <input 
                required
                type="email"
                placeholder="phuhuynh@gmail.com"
                className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all`}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Mật khẩu cấp sẵn*</label>
              <input 
                required
                type="text"
                placeholder="123456"
                className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all`}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.password}</p>}
            </div>
            {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-600 mt-6">
              <i className="fa-solid fa-circle-info mt-0.5"></i>
              <p className="text-[12px] font-medium leading-relaxed">Sau khi tạo xong, bạn hãy copy Email và Mật khẩu này gửi qua Zalo cho Học sinh/Phụ huynh nhé.</p>
            </div>
          </div>

          <div className="p-8 pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3.5 rounded-2xl transition-all text-[15px]"
            >
              Huỷ
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[15px] disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudentAccountModal;
