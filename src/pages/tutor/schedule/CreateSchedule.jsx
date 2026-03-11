import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';
import { ValidationUtils } from '../../../utils/ValidationUtils';
import { useState, useEffect } from 'react';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';

function CreateSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    subject: '',
    studentName: '',
    dayOfWeek: 'Thứ hai',
    startTime: '08:00',
    endTime: '09:30',
    location: 'Tại nhà',
    repeat: 'weekly',
    note: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setErrors({});
      } else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.subject)) newErrors.subject = 'Tên lớp/môn học ít nhất phải có 2 ký tự';
    if (!ValidationUtils.validateName(form.studentName)) newErrors.studentName = 'Tên học sinh ít nhất phải có 2 ký tự';
    
    if (form.startTime && form.endTime) {
      if (form.endTime <= form.startTime) {
        newErrors.time = 'Giờ kết thúc phải sau giờ bắt đầu';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const scheduleRef = ref(db, `schedules/${user.uid}`);
      const newRef = push(scheduleRef);
      await set(newRef, {
        ...form,
        createdAt: new Date().toISOString(),
        tutorId: user.uid,
      });
      setSuccess(true);
      setTimeout(() => navigate('/teaching-schedule'), 1500);
    } catch (error) {
      console.error('Error creating schedule:', error);
      setErrors({ form: 'Tạo lịch thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

  return (
    <>
      <TutorNavbar activePage="teaching-schedule" />

      <main className="pt-[68px] min-h-screen bg-[#f8f9fb]">
        <div className="max-w-[800px] mx-auto px-6 py-10">

          {/* Back */}
          <button onClick={() => navigate('/teaching-schedule')} className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1.5 mb-6">
            <i className="fa-solid fa-arrow-left text-xs"></i> Quay lại lịch dạy
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-slate-900 flex items-center gap-2.5">
              <i className="fa-solid fa-plus-circle text-emerald-500"></i> Tạo lịch dạy mới
            </h1>
            <p className="text-[13px] text-slate-400 mt-1">Điền thông tin để thêm buổi dạy vào lịch của bạn</p>
          </div>

          {/* Success State */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-emerald-500 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-emerald-700 mb-1">Tạo lịch thành công!</h2>
              <p className="text-emerald-600 text-sm">Đang chuyển về trang lịch dạy...</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* Section 1: Thông tin môn học */}
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><i className="fa-solid fa-book text-blue-500 text-xs"></i></span>
                  Thông tin môn học
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên lớp / Môn học *</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      placeholder="VD: Toán 10a1, Lý lớp 11..."
                      className={`w-full bg-slate-50 border ${errors.subject ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`}
                    />
                    {errors.subject && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.subject}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên học sinh *</label>
                    <input
                      type="text"
                      value={form.studentName}
                      onChange={(e) => handleChange('studentName', e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className={`w-full bg-slate-50 border ${errors.studentName ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`}
                    />
                    {errors.studentName && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.studentName}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Thời gian */}
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i className="fa-solid fa-clock text-emerald-500 text-xs"></i></span>
                  Thời gian & Lịch trình
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ngày trong tuần</label>
                    <select
                      value={form.dayOfWeek}
                      onChange={(e) => handleChange('dayOfWeek', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 appearance-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => handleChange('startTime', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => handleChange('endTime', e.target.value)}
                      className={`w-full bg-slate-50 border ${errors.time ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-sm text-slate-900 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`}
                    />
                  </div>
                </div>
                {errors.time && <p className="text-[11px] text-red-500 mb-4 font-bold ml-1">{errors.time}</p>}
                {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mb-4">{errors.form}</div>}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lặp lại</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Hàng tuần', value: 'weekly' },
                      { label: 'Chỉ 1 lần', value: 'once' },
                      { label: 'Hàng ngày', value: 'daily' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange('repeat', opt.value)}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                          form.repeat === opt.value
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Địa điểm & Ghi chú */}
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><i className="fa-solid fa-location-dot text-violet-500 text-xs"></i></span>
                  Địa điểm & Ghi chú
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Địa điểm</label>
                    <div className="flex gap-2">
                      {['Tại nhà', 'Học viên đi', 'Online'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleChange('location', loc)}
                          className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all flex items-center gap-1.5 ${
                            form.location === loc
                              ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <i className={`text-xs ${loc === 'Tại nhà' ? 'fa-solid fa-house' : loc === 'Online' ? 'fa-solid fa-video' : 'fa-solid fa-car'}`}></i>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ghi chú (tuỳ chọn)</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => handleChange('note', e.target.value)}
                    placeholder="VD: Ôn tập chương 3, mang thêm sách bài tập..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Preview + Submit */}
              <div className="p-6 bg-slate-50">
                {/* Preview Card */}
                {form.subject && (
                  <div className="bg-slate-800 rounded-2xl p-5 mb-5">
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">Xem trước</p>
                    <p className="text-white font-bold text-[15px]">
                      {form.startTime} - {form.subject} - {form.studentName || '...'}
                    </p>
                    <p className="text-slate-400 text-[13px] mt-1">
                      {form.dayOfWeek} • {form.startTime} → {form.endTime} • {form.location}
                    </p>
                    {form.note && <p className="text-slate-500 text-[12px] mt-1.5 italic">📝 {form.note}</p>}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/teaching-schedule')}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-all text-sm"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-[#7ae8c7] to-[#86a8ff] text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(134,168,255,0.3)] hover:shadow-[0_10px_25px_rgba(134,168,255,0.4)] hover:-translate-y-0.5 transition-all text-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin"></i> Đang tạo...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-plus"></i> Tạo lịch dạy
                      </span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

export default CreateSchedule;
