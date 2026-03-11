import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';

function AddToClassModal({ isOpen, onClose, userId, preSelectedStudentName }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudentNames, setSelectedStudentNames] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !userId) return;
    setErrors({});
    
    // Fetch Classes
    const classesRef = ref(db, `classes/${userId}`);
    const unsubClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setClasses(list);
    });

    // Fetch Students (to populate the list)
    const studentsRef = ref(db, `students/${userId}`);
    const unsubStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setStudents(list);
    });

    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, [isOpen, userId]);

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      setSelectedClass(cls);
      setSelectedStudentNames(cls?.selectedStudents || []);
    } else {
      setSelectedClass(null);
      setSelectedStudentNames([]);
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (isOpen && preSelectedStudentName && !selectedStudentNames.includes(preSelectedStudentName)) {
      setSelectedStudentNames(prev => [...prev, preSelectedStudentName]);
    }
  }, [isOpen, preSelectedStudentName]);

  const toggleStudent = (name) => {
    setSelectedStudentNames(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedClassId) newErrors.class = 'Vui lòng chọn lớp học';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const classRef = ref(db, `classes/${userId}/${selectedClassId}`);
      await update(classRef, {
        selectedStudents: selectedStudentNames,
        lastEnrollmentNote: note || '' // Optional: store the note somewhere if needed
      });
      onClose();
      setErrors({});
    } catch (error) {
      setErrors({ form: 'Cập nhật thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col z-10 border border-white/20">
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          {/* Header */}
          <div className="px-10 pt-10 pb-6 text-center">
            <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">Thêm học sinh vào lớp</h2>
          </div>

          <div className="px-10 pb-10 space-y-6">
            
            {/* Class Selection */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2 ml-1">Lớp học*</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className={`w-full bg-white border ${errors.class ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3 px-4 text-[14px] text-slate-700 focus:border-blue-400 outline-none transition-all shadow-sm appearance-none cursor-pointer`}
                required
              >
                <option value="">Chọn lớp học</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.class && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.class}</p>}
            </div>

            {/* Online Link Info */}
            {selectedClass?.teachingMode === 'online' && selectedClass?.link && (
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-700 shrink-0">Online Link:</span>
                <a 
                  href={selectedClass.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[13px] text-blue-500 hover:underline truncate font-medium"
                >
                  {selectedClass.link}
                </a>
              </div>
            )}

            {/* Student Multiselect */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-3 ml-1">Học sinh</label>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {students.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => toggleStudent(s.name)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedStudentNames.includes(s.name)
                        ? 'bg-white border-blue-400 shadow-sm'
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                      selectedStudentNames.includes(s.name)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-slate-200 text-transparent'
                    }`}>
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </div>
                    <span className={`text-[14px] font-semibold ${selectedStudentNames.includes(s.name) ? 'text-slate-800' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] font-bold text-slate-400 mb-2 ml-1">Ghi chú</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú"
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-[14px] text-slate-700 placeholder-slate-300 focus:border-blue-400 outline-none transition-all h-20 resize-none shadow-sm"
              />
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-[15px]"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-300 to-blue-400 text-white font-bold py-3.5 rounded-2xl hover:from-emerald-400 hover:to-blue-500 transition-all text-[15px] shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {loading ? 'Đang cập nhật...' : 'Thêm'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddToClassModal;
