import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function EditClassModal({ isOpen, onClose, userId, classId }) {
  const [form, setForm] = useState({
    subject: '',
    symbol: '',
    curriculum: '',
    teachingMode: 'online',
    link: '',
    address: '',
    selectedStudents: [],
    status: 'active',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState(['Toán', 'Lý', 'Hóa', 'Anh', 'Văn']);
  const [studentList, setStudentList] = useState([]);
  const [syllabuses, setSyllabuses] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && userId && classId) {
      setErrors({});
      const classRef = ref(db, `classes/${userId}/${classId}`);
      onValue(classRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setForm({
            ...data,
            subject: data.subject || '',
            symbol: data.symbol || data.name?.split(' ')[1] || '',
            selectedStudents: data.selectedStudents || [],
          });
        }
      }, { onlyOnce: true });

      // Fetch subjects for recommendations
      const classesRef = ref(db, `classes/${userId}`);
      onValue(classesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const existingSubjects = Object.values(data).map(c => c.subject).filter(Boolean);
          setSubjects(Array.from(new Set(['Toán', 'Lý', 'Hóa', 'Anh', 'Văn', ...existingSubjects])));
        }
      }, { onlyOnce: true });

      // Fetch dynamic students list
      const studentsRef = ref(db, `students/${userId}`);
      onValue(studentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setStudentList(Object.values(data).map(s => s.name));
        } else {
          setStudentList([]);
        }
      }, { onlyOnce: true });

      // Fetch dynamic syllabuses list
      const syllabusesRef = ref(db, `syllabuses/${userId}`);
      onValue(syllabusesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const syllabusArray = Object.keys(data).map(key => ({
             id: key,
             ...data[key]
          }));
          setSyllabuses(syllabusArray);
        } else {
          setSyllabuses([]);
        }
      }, { onlyOnce: true });
    }
  }, [isOpen, userId, classId]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleStudent = (student) => {
    setForm(prev => {
      const students = prev.selectedStudents.includes(student)
        ? prev.selectedStudents.filter(s => s !== student)
        : [...prev.selectedStudents, student];
      return { ...prev, selectedStudents: students };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.subject)) newErrors.subject = 'Vui lòng nhập môn học';
    if (!form.symbol.trim()) newErrors.symbol = 'Vui lòng nhập tên lớp';
    if (form.selectedStudents.length === 0) newErrors.students = 'Vui lòng chọn ít nhất một học sinh';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const classNameFull = `${form.subject} ${form.symbol}`;
    setLoading(true);
    try {
      const classRef = ref(db, `classes/${userId}/${classId}`);
      await update(classRef, {
        ...form,
        name: classNameFull,
        updatedAt: new Date().toISOString()
      });
      onClose();
      setErrors({});
    } catch (error) {
      setErrors({ form: 'Lỗi cập nhật: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá lớp học này? Hành động này không thể hoàn tác. Các buổi dạy trong quá khứ vẫn sẽ được giữ lại trong lịch sử.')) return;
    setLoading(true);
    try {
      // 1. Fetch all schedules for this tutor
      const schedulesRef = ref(db, `schedules/${userId}`);
      const schedulesSnap = await get(schedulesRef);
      
      if (schedulesSnap.exists()) {
        const schedulesData = schedulesSnap.val();
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const updates = {};
        const removals = [];

        Object.entries(schedulesData).forEach(([sid, s]) => {
          if (s.classId === classId) {
            if (s.scheduleType === 'single') {
              // Delete future single sessions
              if (s.startDate >= now.toISOString().split('T')[0]) {
                removals.push(`schedules/${userId}/${sid}`);
              }
            } else if (s.scheduleType === 'weekly') {
              // Set endDate to yesterday for weekly schedules to preserve history
              updates[`schedules/${userId}/${sid}/endDate`] = yesterdayStr;
            }
          }
        });

        // Execute removals and updates
        for (const path of removals) {
          await remove(ref(db, path));
        }
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }

      // 2. Remove the class
      await remove(ref(db, `classes/${userId}/${classId}`));
      
      alert('Đã xoá lớp học. Lịch sử dạy học đã được lưu giữ.');
      onClose();
      window.location.href = '/classes';
    } catch (error) {
      alert('Lỗi khi xoá: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { key: 'T2', label: 'Thứ hai' },
    { key: 'T3', label: 'Thứ ba' },
    { key: 'T4', label: 'Thứ tư' },
    { key: 'T5', label: 'Thứ năm' },
    { key: 'T6', label: 'Thứ sáu' },
    { key: 'T7', label: 'Thứ bảy' },
    { key: 'CN', label: 'Chủ nhật' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden z-10">
        <form onSubmit={handleUpdate} className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-8 pb-4 shrink-0">
            <h2 className="text-[24px] font-bold text-slate-900 text-center">Cập nhật lớp học</h2>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
            
            {/* Subject & Class Symbol */}
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Môn học:</label>
                <div className="relative">
                  <input
                    list="subjects-edit"
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className={`w-full bg-slate-50 border ${errors.subject ? 'border-red-500' : 'border-none'} rounded-2xl py-3 px-4 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-400 outline-none appearance-none cursor-pointer`}
                    placeholder="Chọn hoặc nhập môn học"
                    required
                  />
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                  <datalist id="subjects-edit">
                    {subjects.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                {errors.subject && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.subject}</p>}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Tên lớp:</label>
                  <input
                    type="text"
                    value={form.symbol}
                    onChange={(e) => handleChange('symbol', e.target.value)}
                    className={`w-full bg-slate-50 border ${errors.symbol ? 'border-red-500' : 'border-none'} rounded-2xl py-3 px-4 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-400 outline-none`}
                    placeholder="VD: 06, ABC..."
                    required
                  />
                  {errors.symbol && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.symbol}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Giáo trình:</label>
                <div className="relative">
                  <select
                    value={form.curriculum}
                    onChange={(e) => handleChange('curriculum', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Không có nội dung chung</option>
                    {syllabuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.subject} {s.grade})</option>
                    ))}
                    {/* Fallback for old hardcoded strings if any */}
                    {!syllabuses.find(s => s.id === form.curriculum) && form.curriculum && (
                       <option value={form.curriculum}>{form.curriculum} (Dữ liệu cũ)</option>
                    )}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                </div>
              </div>
            </div>

            {/* Teaching Mode */}
            <div className="space-y-3">
              <label className="block text-[13px] font-bold text-slate-700 ml-1">Hình thức dạy:</label>
              <div className="flex gap-8 ml-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="teachingMode-edit" 
                    value="online" 
                    checked={form.teachingMode === 'online'} 
                    onChange={(e) => handleChange('teachingMode', e.target.value)} 
                    className="w-4 h-4 border-2 border-slate-300 text-blue-500 focus:ring-blue-500 accent-blue-500" 
                  />
                  <span className="text-[14px] text-slate-600 font-medium">Trực tuyến</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="teachingMode-edit" 
                    value="offline" 
                    checked={form.teachingMode === 'offline'} 
                    onChange={(e) => handleChange('teachingMode', e.target.value)} 
                    className="w-4 h-4 border-2 border-slate-300 text-blue-500 focus:ring-blue-500 accent-blue-500" 
                  />
                  <span className="text-[14px] text-slate-600 font-medium">Trực tiếp</span>
                </label>
              </div>
              <input
                type={form.teachingMode === 'online' ? 'url' : 'text'}
                value={form.teachingMode === 'online' ? form.link : form.address}
                onChange={(e) => handleChange(form.teachingMode === 'online' ? 'link' : 'address', e.target.value)}
                placeholder={form.teachingMode === 'online' ? "https://meet.google.com/..." : "Địa chỉ học tại nhà..."}
                className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>



            {/* Students Selection */}
            <div className="space-y-3">
              <label className="block text-[13px] font-bold text-slate-700 ml-1">Học sinh</label>
              {errors.students && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.students}</p>}
              <div className="space-y-2">
                {studentList.length === 0 ? (
                  <p className="text-[13px] text-slate-500 italic px-2">Chưa có học sinh nào. Hãy thêm học sinh trước.</p>
                ) : (
                  studentList.map((student) => {
                    const isSelected = form.selectedStudents.includes(student);
                    return (
                      <div 
                        key={student}
                        onClick={() => toggleStudent(student)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected ? 'bg-white border-blue-500 shadow-sm' : 'bg-white border-slate-100'
                        } ${errors.students ? 'border-red-100' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                          isSelected ? 'bg-black text-white border-black' : 'bg-white text-slate-300 border-slate-100'
                        }`}>
                          <i className={`fa-solid ${isSelected ? 'fa-xmark' : 'fa-check opacity-0'}`}></i>
                        </div>
                        <span className={`text-[14px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{student}</span>
                      </div>
                    );
                  })
                )}
              </div>
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2 ml-1">{errors.form}</div>}
            </div>

          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-2xl text-[13px] transition-all shadow-lg shadow-red-100"
            >
              Xoá lớp học
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-6 py-3 rounded-2xl text-[13px] transition-all"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-8 py-3 rounded-2xl text-[13px] transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditClassModal;
