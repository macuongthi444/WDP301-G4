import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValidationUtils } from '../../utils/ValidationUtils';

function EditStudentModal({ isOpen, onClose, userId, studentData }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    birthday: '',
    gender: 'Nam',
    grade: '',
    school: '',
    parentName: '',
    parentPhone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && studentData) {
      setForm({
        name: studentData.name || '',
        phone: studentData.phone || '',
        address: studentData.address || '',
        birthday: studentData.birthday || '',
        gender: studentData.gender || 'Nam',
        grade: studentData.grade || '',
        school: studentData.school || '',
        parentName: studentData.parentName || '',
        parentPhone: studentData.parentPhone || '',
        notes: studentData.notes || '',
      });
      setErrors({});
    }
  }, [isOpen, studentData]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.name)) newErrors.name = 'Họ và tên ít nhất phải có 2 ký tự';
    
    if (form.phone && !ValidationUtils.validatePhone(form.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (form.parentPhone && !ValidationUtils.validatePhone(form.parentPhone)) {
      newErrors.parentPhone = 'Số điện thoại phụ huynh không hợp lệ';
    }
    
    if (form.birthday && !ValidationUtils.validateStudentAge(form.birthday)) {
      newErrors.birthday = 'Học sinh phải từ 3 đến 100 tuổi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const studentRef = ref(db, `students/${userId}/${studentData.id}`);
      await update(studentRef, form);
      onClose();
    } catch (error) {
      setErrors({ form: 'Cập nhật thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Check if student is in any class
      const classesRef = ref(db, `classes/${userId}`);
      const classesSnap = await get(classesRef);
      
      if (classesSnap.exists()) {
        const classesData = classesSnap.val();
        const isInClass = Object.values(classesData).some(c => 
          c.selectedStudents && Array.isArray(c.selectedStudents) && 
          c.selectedStudents.includes(studentData.name)
        );

        if (isInClass) {
          alert('Học sinh này đang tham gia lớp học. Bạn cần xóa học sinh khỏi lớp hoặc xóa lớp học trước khi có thể xóa học sinh.');
          setLoading(false);
          return;
        }
      }

      if (!window.confirm('Bạn có chắc chắn muốn xoá học sinh này? Hành động này không thể hoàn tác.')) {
        setLoading(false);
        return;
      }
      
      const studentRef = ref(db, `students/${userId}/${studentData.id}`);
      await remove(studentRef);
      alert('Đã xoá học sinh!');
      onClose();
      navigate('/students');
    } catch (error) {
      alert('Xoá thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto z-10 border border-white/20 custom-scrollbar">
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          
          <h2 className="text-[28px] font-bold text-slate-800 text-center mb-8">Cập nhật thông tin</h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Họ và tên*</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nguyen Van A"
                className={`w-full bg-white border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium`}
                required
              />
              {errors.name && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Số điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0123456789"
                className={`w-full bg-white border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium`}
              />
              {errors.phone && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Địa chỉ</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Đại học FPT"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium"
              />
            </div>

            {/* Birthday & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Ngày, tháng, năm sinh</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => handleChange('birthday', e.target.value)}
                  className={`w-full bg-white border ${errors.birthday ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium cursor-pointer appearance-none`}
                />
                {errors.birthday && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.birthday}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Giới tính</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            {/* Grade & School */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={form.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                placeholder="06"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium"
              />
              <input
                type="text"
                value={form.school}
                onChange={(e) => handleChange('school', e.target.value)}
                placeholder="Trường Trung học cơ sở FPT"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium"
              />
            </div>

            {/* Parents Info */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2 ml-1">Thông tin bố mẹ</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => handleChange('parentName', e.target.value)}
                  placeholder="Nguyễn Thị AA"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium"
                />
                <input
                  type="text"
                  value={form.parentPhone}
                  onChange={(e) => handleChange('parentPhone', e.target.value)}
                  placeholder="0987654321"
                  className={`w-full bg-white border ${errors.parentPhone ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all font-medium`}
                />
              </div>
            </div>
            {errors.parentPhone && <p className="text-[11px] text-red-500 ml-1 font-bold">{errors.parentPhone}</p>}
            {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold">{errors.form}</div>}

            {/* Notes */}
            <div>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Ghi chú"
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-[14px] outline-none focus:border-blue-400 transition-all h-24 resize-none font-medium"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-red-600 transition-all text-[15px] shadow-lg shadow-red-500/20"
            >
              Xoá học sinh
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 text-slate-600 font-bold py-3.5 px-8 rounded-2xl hover:bg-slate-200 transition-all text-[15px]"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-300 to-blue-400 text-white font-bold py-3.5 px-8 rounded-2xl hover:from-emerald-400 hover:to-blue-500 transition-all text-[15px] shadow-lg shadow-blue-500/20"
              >
                Cập nhật
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditStudentModal;
