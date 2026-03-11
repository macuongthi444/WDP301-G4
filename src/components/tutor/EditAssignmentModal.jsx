import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function EditAssignmentModal({ isOpen, onClose, userId, scheduleId, date, assignmentId, currentAssignment }) {
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

  // Initialize form when opened
  useEffect(() => {
    if (currentAssignment) {
      setForm({
        title: currentAssignment.title || '',
        dueDate: currentAssignment.dueDate || '',
        dueTime: currentAssignment.dueTime || '',
        description: currentAssignment.description || '',
        selectedStudents: currentAssignment.selectedStudents || [],
        fileName: currentAssignment.fileName || '',
      });
      setErrors({});
    }
  }, [currentAssignment]);

  useEffect(() => {
    if (!isOpen || !userId || !currentAssignment || !currentAssignment.className) return;
    
    const className = currentAssignment.className;
    const classesRef = ref(db, `classes/${userId}`);
    const unsubscribe = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const classObj = Object.values(data).find(c => c.name === className);
        if (classObj && classObj.selectedStudents) {
          setClassStudents(classObj.selectedStudents);
        } else {
          setClassStudents(currentAssignment.selectedStudents || []); // fallback
        }
      } else {
        setClassStudents([]);
      }
    });

    return () => unsubscribe();
  }, [isOpen, userId, currentAssignment]);

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
      let fileUrl = currentAssignment.fileUrl || '';
      let filePath = currentAssignment.filePath || null;
      if (file) {
        filePath = `assignments/${userId}/${Date.now()}_${file.name}`;
        const fileRef = sRef(storage, filePath);
        const snapshot = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      const assignmentRef = ref(db, `assignments/${userId}/${scheduleId}/${date}/${assignmentId}`);

      await update(assignmentRef, {
        title: form.title,
        dueDate: form.dueDate,
        dueTime: form.dueTime,
        description: form.description,
        selectedStudents: form.selectedStudents,
        fileName: form.fileName,
        fileUrl: fileUrl,
        filePath: filePath,
        updatedAt: new Date().toISOString()
      });

      onClose();
      setErrors({});
    } catch (error) {
      setErrors({ form: 'Cập nhật bài tập thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[460px] max-h-[90vh] overflow-hidden flex flex-col z-10 border border-white/20">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center shrink-0">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Bài tập</h2>
          </div>

          {/* Scrollable Content */}
          <div className="px-8 py-2 space-y-5 overflow-y-auto flex-1 custom-scrollbar min-h-0">
            
            {/* Title */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2">Tiêu đề</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="VD: Hình học không gian bài 5"
                className={`w-full bg-white border ${errors.title ? 'border-red-500' : 'border-slate-300'} rounded-lg py-3 px-4 text-[14px] text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all`}
                required
              />
              {errors.title && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.title}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-2">Ngày nộp</label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className={`w-full bg-white border ${errors.dueDate ? 'border-red-500' : 'border-slate-300'} rounded-lg py-3 pl-4 pr-10 text-[14px] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer placeholder-slate-400 block`}
                  />
                  <i className="fa-regular fa-calendar absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"></i>
                </div>
                {errors.dueDate && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.dueDate}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-2">Thời hạn</label>
                <div className="relative">
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => handleChange('dueTime', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-4 pr-10 text-[14px] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer placeholder-slate-400 block"
                  />
                  <i className="fa-regular fa-clock absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"></i>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Viết hướng dẫn, hoặc yêu cầu cho bài tập..."
                className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-[14px] text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-28 resize-none"
              />
            </div>

            {/* Students List */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2">Học sinh</label>
              {errors.students && <p className="text-[11px] text-red-500 font-bold mb-2 ml-1">{errors.students}</p>}
              <div className="space-y-2">
                {classStudents.length === 0 ? (
                  <p className="text-[13px] text-slate-500 italic">Không có học sinh.</p>
                ) : (
                  classStudents.map((name) => {
                    const isSelected = form.selectedStudents.includes(name);
                    return (
                      <div
                        key={name}
                        onClick={() => toggleStudent(name)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-white border-slate-300 hover:border-slate-400'
                        } ${errors.students ? 'border-red-100' : ''}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-400 bg-white'
                        }`}>
                          {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                        </div>
                        <span className={`text-[14px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}
            </div>

            {/* File Upload Box */}
            <div className="pt-2">
              <input
                id="edit-homework-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="edit-homework-file"
                className="flex flex-col items-center justify-center py-6 px-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span className="text-[18px] font-bold text-slate-400 mb-3 block">
                  {form.fileName ? form.fileName : 'Tải tệp lên'}
                </span>
                <div className="text-slate-800 text-2xl">
                  <i className="fa-solid fa-arrow-up-from-bracket"></i>
                </div>
              </label>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 shrink-0 flex justify-end gap-3 mt-2 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 text-slate-600 font-bold px-6 py-2.5 rounded-xl text-[14px] hover:bg-slate-300 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-teal-400 to-indigo-400 text-white font-bold px-8 py-2.5 rounded-xl text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAssignmentModal;
