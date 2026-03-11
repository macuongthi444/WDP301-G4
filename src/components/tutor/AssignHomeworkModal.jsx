import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function AssignHomeworkModal({ isOpen, onClose, userId, scheduleId, date, className }) {
  const [form, setForm] = useState({
    title: '',
    dueDate: '',
    dueTime: '',
    description: '',
    selectedStudents: [], 
    fileName: '',
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !userId || !className) return;
    setErrors({});
    
    const classesRef = ref(db, `classes/${userId}`);
    const unsubscribe = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const classObj = Object.values(data).find(c => c.name === className);
        if (classObj && classObj.selectedStudents) {
          setClassStudents(classObj.selectedStudents);
          setForm(prev => ({ ...prev, selectedStudents: classObj.selectedStudents }));
        } else {
          setClassStudents([]);
          setForm(prev => ({ ...prev, selectedStudents: [] }));
        }
      } else {
        setClassStudents([]);
        setForm(prev => ({ ...prev, selectedStudents: [] }));
      }
    });

    return () => unsubscribe();
  }, [isOpen, userId, className]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.title)) newErrors.title = 'Vui lòng nhập tiêu đề bài tập';
    if (!form.dueDate) newErrors.dueDate = 'Vui lòng chọn ngày nộp';
    if (form.selectedStudents.length === 0) newErrors.students = 'Vui lòng chọn ít nhất một học sinh';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setForm(prev => ({ ...prev, fileName: selectedFile.name }));
    }
  };

  const toggleStudent = (student) => {
    setForm((prev) => {
      const students = prev.selectedStudents.includes(student)
        ? prev.selectedStudents.filter((s) => s !== student)
        : [...prev.selectedStudents, student];
      return { ...prev, selectedStudents: students };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let fileUrl = '';
      let filePath = null;
      if (file) {
        filePath = `assignments/${userId}/${Date.now()}_${file.name}`;
        const fileRef = sRef(storage, filePath);
        const snapshot = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      const assignmentRef = ref(db, `assignments/${userId}/${scheduleId}/${date}`);
      const newRef = push(assignmentRef);

      await set(newRef, {
        ...form,
        fileUrl: fileUrl,
        filePath: filePath,
        createdAt: new Date().toISOString()
      });

      onClose();
      // Reset form
      setForm({
        title: '', dueDate: '', dueTime: '', description: '',
        selectedStudents: classStudents,
        fileName: ''
      });
      setFile(null);
      setErrors({});
    } catch (error) {
      setErrors({ form: 'Giao bài tập thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[420px] max-h-[90vh] overflow-hidden flex flex-col z-10 border border-white/20">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* Header (Fixed) */}
          <div className="px-8 pt-8 pb-4 text-center shrink-0">
            <h2 className="text-[22px] font-bold text-slate-800 tracking-tight">Bài tập</h2>
            <div className="h-1 w-12 bg-blue-500 mx-auto mt-2 rounded-full"></div>
          </div>

          {/* Scrollable Content */}
          <div className="px-8 py-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">

            {/* Title */}
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tiêu đề</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="VD: Hình học không gian bài 5"
                className={`w-full bg-slate-50 border-2 ${errors.title ? 'border-red-500' : 'border-slate-100'} rounded-2xl py-3 px-4 text-[14px] text-slate-700 placeholder-slate-300 focus:bg-white focus:border-blue-400 outline-none transition-all`}
                required
              />
              {errors.title && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.title}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ngày nộp</label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className={`w-full bg-slate-50 border-2 ${errors.dueDate ? 'border-red-500' : 'border-slate-100'} rounded-2xl py-3 pl-4 pr-10 text-[13px] text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all appearance-none cursor-pointer`}
                  />
                  <i className="fa-regular fa-calendar absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"></i>
                </div>
                {errors.dueDate && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.dueDate}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Thời hạn</label>
                <div className="relative">
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => handleChange('dueTime', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-4 pr-10 text-[13px] text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all appearance-none cursor-pointer"
                  />
                  <i className="fa-regular fa-clock absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"></i>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Viết hướng dẫn, hoặc yêu cầu cho bài tập..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-[13px] text-slate-700 placeholder-slate-300 focus:bg-white focus:border-blue-400 outline-none transition-all h-24 resize-none"
              />
            </div>

            {/* Students */}
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Học sinh</label>
              {errors.students && <p className="text-[11px] text-red-500 font-bold mb-2 ml-1">{errors.students}</p>}
              <div className="space-y-2">
                {classStudents.length === 0 ? (
                    <p className="text-[13px] text-slate-500 italic px-2">Chưa có học sinh nào trong lớp này.</p>
                ) : (
                  classStudents.map((name) => (
                    <div
                      key={name}
                      onClick={() => toggleStudent(name)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${form.selectedStudents.includes(name)
                          ? 'bg-white border-blue-400 shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                        } ${errors.students ? 'border-red-100' : ''}`}
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
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}
            </div>

            {/* Upload Area */}
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tài liệu đính kèm</label>
              <input
                id="homework-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="homework-file"
                className={`border-2 border-dashed rounded-[24px] p-5 text-center transition-all cursor-pointer group block ${form.fileName ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 shrink-0 ${form.fileName ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 group-hover:text-blue-500'
                    }`}>
                    <i className={form.fileName ? "fa-solid fa-file-circle-check" : "fa-solid fa-cloud-arrow-up"}></i>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    {form.fileName ? (
                      <>
                        <p className="text-[13px] font-bold text-blue-600 truncate">{form.fileName}</p>
                        <p className="text-[10px] text-blue-400">Thay đổi tệp khác</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-bold text-slate-500 group-hover:text-blue-500 transition-colors">Chọn tệp từ máy tính</p>
                        <p className="text-[10px] text-slate-400">PDF, Hình ảnh, Word...</p>
                      </>
                    )}
                  </div>
                  {!form.fileName && (
                    <div className="bg-slate-200/50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                      CHỌN
                    </div>
                  )}
                </div>
              </label>
            </div>

          </div>

          {/* Footer (Fixed) */}
          <div className="px-8 py-6 bg-slate-50/50 flex gap-3 shrink-0 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200/70 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-[14px]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.2] bg-blue-400 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-500 transition-all text-[14px] shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {loading ? 'Đang giao...' : 'Thêm'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AssignHomeworkModal;
