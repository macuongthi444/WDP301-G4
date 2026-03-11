import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function AddStudentModal({ isOpen, onClose, userId }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dob: '',
    gender: 'Nam',
    grade: '',
    school: '',
    parentName: '',
    parentPhone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(formData.name)) newErrors.name = 'Họ và tên ít nhất phải có 2 ký tự';
    
    if (formData.phone && !ValidationUtils.validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (formData.parentPhone && !ValidationUtils.validatePhone(formData.parentPhone)) {
      newErrors.parentPhone = 'Số điện thoại phụ huynh không hợp lệ';
    }
    
    if (formData.dob && !ValidationUtils.validateStudentAge(formData.dob)) {
      newErrors.dob = 'Học sinh phải từ 3 đến 100 tuổi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const studentsRef = ref(db, `students/${userId}`);
      const newStudentRef = push(studentsRef);
      await set(newStudentRef, {
        ...formData,
        createdAt: new Date().toISOString()
      });
      onClose();
      // Reset form
      setFormData({
        name: '',
        phone: '',
        address: '',
        dob: '',
        gender: 'Nam',
        grade: '',
        school: '',
        parentName: '',
        parentPhone: '',
        notes: ''
      });
      setErrors({});
    } catch (error) {
      setErrors({ form: 'Lỗi khi thêm học sinh: ' + error.message });
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
      <div className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-8 pb-4 text-center">
            <h2 className="text-[24px] font-black text-slate-800">Thêm học sinh mới</h2>
          </div>

          {/* Body */}
          <div className="p-8 pt-0 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Họ và tên*</label>
              <input 
                required
                type="text"
                placeholder="Nguyễn Văn A..."
                className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all`}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              {errors.name && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Số điện thoại</label>
              <input 
                type="text"
                placeholder="0xxx xxx xxx"
                className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all`}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              {errors.phone && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Địa chỉ</label>
              <input 
                type="text"
                placeholder="Số nhà, đường, phường/xã..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Ngày, tháng, năm sinh</label>
                <input 
                  type="date"
                  className={`w-full bg-slate-50 border ${errors.dob ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer`}
                  onClick={(e) => e.target.showPicker?.()}
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
                {errors.dob && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.dob}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Giới tính</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer appearance-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <input 
                  type="text"
                  placeholder="Khối lớp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <input 
                  type="text"
                  placeholder="Trường học"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all"
                  value={formData.school}
                  onChange={(e) => setFormData({...formData, school: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-[24px] space-y-4">
              <p className="text-[13px] font-bold text-slate-800">Thông tin bố mẹ</p>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text"
                  placeholder="Tên bố mẹ"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-blue-400 transition-all"
                  value={formData.parentName}
                  onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                />
                <input 
                  type="text"
                  placeholder="Số điện thoại"
                  className={`w-full bg-white border ${errors.parentPhone ? 'border-red-500' : 'border-slate-200'} rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-blue-400 transition-all`}
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                />
              </div>
              {errors.parentPhone && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.parentPhone}</p>}
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold">{errors.form}</div>}
            </div>

            <div className="space-y-1.5">
              <textarea 
                placeholder="Ghi chú"
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
          </div>

          {/* Footer */}
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
              {loading ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;
