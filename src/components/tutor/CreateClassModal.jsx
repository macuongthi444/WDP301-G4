import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useMemo } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function CreateClassModal({ isOpen, onClose, userId }) {
  const [form, setForm] = useState({
    subject: '',
    symbol: '',
    curriculum: '',
    teachingMode: 'online',
    link: '',
    address: '',
    selectedStudents: [],
    status: 'active'
  });
  const [existingClasses, setExistingClasses] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [syllabuses, setSyllabuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!userId || !isOpen) return;
    setErrors({});
    const classesRef = ref(db, `classes/${userId}`);
    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      setExistingClasses(data ? Object.values(data) : []);
    });

    const studentsRef = ref(db, `students/${userId}`);
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      setStudentList(data ? Object.values(data).map(s => s.name) : []);
    });

    const syllabusesRef = ref(db, `syllabuses/${userId}`);
    const unsubscribeSyllabuses = onValue(syllabusesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSyllabuses(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setSyllabuses([]);
      }
    });

    return () => {
      unsubscribeClasses();
      unsubscribeStudents();
      unsubscribeSyllabuses();
    };
  }, [userId, isOpen]);

  const recommendedSubjects = useMemo(() => {
    const subjects = existingClasses.map(c => c.subject).filter(Boolean);
    const defaults = ['Toán', 'Lý', 'Hoá', 'Tiếng Anh', 'Văn'];
    return [...new Set([...defaults, ...subjects])];
  }, [existingClasses]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.subject)) newErrors.subject = 'Vui lòng chọn hoặc nhập môn học';
    if (!form.symbol.trim()) newErrors.symbol = 'Vui lòng nhập tên lớp (ví dụ: 06)';
    if (form.selectedStudents.length === 0) newErrors.students = 'Vui lòng chọn ít nhất một học sinh';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const classNameFull = `${form.subject} ${form.symbol}`;
    setLoading(true);
    try {
      const classRef = ref(db, `classes/${userId}`);
      const newClassRef = push(classRef);
      await set(newClassRef, {
        ...form,
        name: classNameFull,
        createdAt: new Date().toISOString()
      });
      onClose();
      setForm({
        subject: '', symbol: '', curriculum: '', teachingMode: 'online', link: '', address: '',
        selectedStudents: [], status: 'active'
      });
    } catch (error) {
      setErrors({ form: 'Lỗi: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (student) => {
    setForm(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(student)
        ? prev.selectedStudents.filter(s => s !== student)
        : [...prev.selectedStudents, student]
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col overflow-hidden z-10 border border-white/20">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          
          {/* Header (Fixed) */}
          <div className="px-10 pt-10 pb-4 text-center shrink-0">
            <h2 className="text-[26px] font-bold text-slate-800 tracking-tight">Thêm lớp học</h2>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="px-10 py-2 space-y-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
            
            {/* Subject Selection with Datalist */}
            <div className="flex items-center gap-4">
              <label className="text-[14px] font-medium text-slate-600 w-24 shrink-0">Môn học:</label>
              <div className="flex-1">
                <input
                  list="subject-options"
                  placeholder="VD: Toán, Lý..."
                  className={`w-full bg-white border ${errors.subject ? 'border-red-500' : 'border-slate-300'} rounded-lg py-2 px-4 text-[14px] text-slate-700 focus:border-blue-400 outline-none transition-all`}
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  required
                />
                <datalist id="subject-options">
                  {recommendedSubjects.map(s => <option key={s} value={s} />)}
                </datalist>
                {errors.subject && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.subject}</p>}
              </div>
            </div>

            {/* Class Symbol */}
            <div className="flex items-center gap-4">
              <label className="text-[14px] font-medium text-slate-600 w-24 shrink-0">Tên lớp:</label>
              <input
                type="text"
                placeholder="VD: 06, A1, B2..."
                className={`flex-1 bg-white border ${errors.symbol ? 'border-red-500' : 'border-slate-300'} rounded-lg py-2 px-4 text-[14px] text-slate-700 focus:border-blue-400 outline-none transition-all`}
                value={form.symbol}
                onChange={(e) => setForm({...form, symbol: e.target.value})}
                required
              />
            </div>
            {errors.symbol && <p className="text-[11px] text-red-500 ml-28 font-bold">{errors.symbol}</p>}

            {/* Curriculum Selection */}
            <div className="flex items-center gap-4">
              <label className="text-[14px] font-medium text-slate-600 w-24 shrink-0">Giáo trình:</label>
              <div className="relative flex-1">
                <select
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-4 text-[14px] text-slate-700 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                  value={form.curriculum}
                  onChange={(e) => setForm({...form, curriculum: e.target.value})}
                >
                  <option value="">Không có nội dung chung</option>
                  {syllabuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.subject} {s.grade})</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
              </div>
            </div>

            {/* Teaching Mode Details */}
            <div className="space-y-4">
              <label className="block text-[14px] font-medium text-slate-600">Hình thức dạy:</label>
              <div className="flex gap-10 pl-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="teachingMode" value="online" checked={form.teachingMode === 'online'} onChange={(e) => setForm({...form, teachingMode: e.target.value})} className="w-4 h-4 text-blue-500 accent-blue-500" />
                  <span className={`text-[14px] font-medium transition-colors ${form.teachingMode === 'online' ? 'text-slate-900' : 'text-slate-500'}`}>Trực tuyến</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="teachingMode" value="offline" checked={form.teachingMode === 'offline'} onChange={(e) => setForm({...form, teachingMode: e.target.value})} className="w-4 h-4 text-blue-500 accent-blue-500" />
                  <span className={`text-[14px] font-medium transition-colors ${form.teachingMode === 'offline' ? 'text-slate-900' : 'text-slate-500'}`}>Trực tiếp</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-500 ml-1">
                  {form.teachingMode === 'online' ? 'Link học:' : 'Địa điểm:'}
                </label>
                {form.teachingMode === 'online' ? (
                  <input
                    type="text"
                    placeholder="https://meet.google.com/abc"
                    className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-[13px] text-blue-600 focus:border-blue-400 outline-none transition-all placeholder-slate-300"
                    value={form.link}
                    onChange={(e) => setForm({...form, link: e.target.value})}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ dạy học..."
                    className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-[13px] text-slate-700 focus:border-blue-400 outline-none transition-all placeholder-slate-300"
                    value={form.address || ''}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                  />
                )}
              </div>
            </div>


            {/* Student List Selection */}
            <div className="space-y-3 pt-2">
              <label className="block text-[14px] font-medium text-slate-600">Học sinh</label>
              {errors.students && <p className="text-[11px] text-red-500 font-bold">{errors.students}</p>}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {studentList.length === 0 ? (
                  <p className="text-[13px] text-slate-500 italic px-2">Chưa có học sinh nào. Hãy thêm học sinh trước.</p>
                ) : (
                  studentList.map((name) => (
                    <div
                      key={name}
                      onClick={() => toggleStudent(name)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${form.selectedStudents.includes(name)
                          ? 'bg-white border-blue-400 shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                        } ${errors.students ? 'border-red-200' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${form.selectedStudents.includes(name)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-slate-200 text-transparent'
                        }`}>
                        <i className="fa-solid fa-check text-[10px]"></i>
                      </div>
                      <span className={`text-[13px] font-medium ${form.selectedStudents.includes(name) ? 'text-slate-800' : 'text-slate-500'}`}>
                        {name}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold">{errors.form}</div>}
            </div>

          </div>

          {/* Footer (Fixed) */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2.5 rounded-full bg-[#E5E7EB] text-slate-600 font-bold hover:bg-slate-200 transition-all text-[14px]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#93C5FD] to-[#3B82F6] text-white font-bold hover:opacity-90 transition-all text-[14px] shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassModal;
