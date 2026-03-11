import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { ValidationUtils } from '../../utils/ValidationUtils';

function UploadSyllabusModal({ isOpen, onClose, userId }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingSubjects, setExistingSubjects] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    grade: '',
    subject: '',
  });

  const defaultSubjects = ['Toán', 'Lý', 'Hoá', 'Tiếng Anh', 'Văn'];
  const grades = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', 'Khác...'];

  useEffect(() => {
    let unsubscribe;
    if (isOpen && userId) {
      setErrors({});
      const syllabusRef = dbRef(db, `syllabuses/${userId}`);
      unsubscribe = onValue(syllabusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const subs = Object.values(data).map(s => s.subject);
          setExistingSubjects([...new Set([...defaultSubjects, ...subs])].sort());
        } else {
          setExistingSubjects(defaultSubjects);
        }
      });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name if empty
      if (!form.name) {
        setForm(prev => ({ ...prev, name: file.name.split('.').slice(0, -1).join('.') }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.name)) newErrors.name = 'Vui lòng nhập tên giáo trình';
    if (!form.subject) newErrors.subject = 'Vui lòng chọn môn học';
    if (!form.grade.trim()) newErrors.grade = 'Vui lòng chọn hoặc nhập khối lớp';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setUploadProgress(0);
    
    try {
      let downloadUrl = '#';
      let fileName = 'Chưa có file';
      let finalPath = null;
      
      if (selectedFile) {
        fileName = selectedFile.name;
        const filePath = `syllabuses/${userId}/${Date.now()}_${selectedFile.name}`;
        const fileRef = storageRef(storage, filePath);
        const metadata = { contentType: selectedFile.type };
        const uploadTask = uploadBytesResumable(fileRef, selectedFile, metadata);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                downloadUrl = url;
                // Store the final path used
                finalPath = filePath;
                resolve();
              });
            }
          );
        });
      }

      const syllabusDataRef = dbRef(db, `syllabuses/${userId}`);
      const newSyllabusRef = push(syllabusDataRef);
      
      const fileSize = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB';

      await set(newSyllabusRef, {
        ...form,
        fileName: fileName,
        uploadDate: new Date().toISOString(),
        size: fileSize,
        fileUrl: downloadUrl,
        filePath: finalPath,
        createdAt: new Date().toISOString()
      });

      onClose();
      setForm({ name: '', grade: '', subject: '' });
      setSelectedFile(null);
      setUploadProgress(0);
      setErrors({});
    } catch (error) {
      console.error('Error uploading syllabus:', error);
      setErrors({ form: 'Tải lên thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-[20px] font-bold text-slate-800">Tải giáo trình lên</h2>
            <p className="text-[13px] text-slate-400 mt-0.5">Thêm tài liệu mới vào thư viện của bạn</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Syllabus Name */}
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tên giáo trình</label>
              <input
                type="text"
                placeholder="VD: Toán nâng cao lớp 6 - Tập 1"
                className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-5 text-[14px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Grade */}
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Khối</label>
                <select
                  className={`w-full bg-slate-50 border ${errors.grade ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-5 text-[14px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer`}
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  required
                >
                  <option value="">Chọn khối</option>
                  {grades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.grade && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.grade}</p>}
              </div>

              {/* Subject */}
              <div className="relative">
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Môn học</label>
                <div className="relative">
                  <input
                    type="text"
                    list="subject-suggestions"
                    placeholder="Chọn hoặc nhập..."
                    className={`w-full bg-slate-50 border ${errors.subject ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-5 text-[14px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all`}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                  <datalist id="subject-suggestions">
                    {existingSubjects.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
                </div>
                {errors.subject && <p className="text-[11px] text-red-500 mt-1 font-bold ml-1">{errors.subject}</p>}
              </div>
            </div>
            {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mt-2">{errors.form}</div>}

            {/* File Upload picker */}
            <div 
              onClick={() => document.getElementById('syllabus-file-input').click()}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
            >
               <input 
                  id="syllabus-file-input"
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
               />
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
               </div>
               {selectedFile ? (
                 <div>
                   <p className="text-[13px] font-bold text-blue-600 truncate px-4">{selectedFile.name}</p>
                   <p className="text-[11px] text-slate-400 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                 </div>
               ) : (
                 <>
                   <p className="text-[13px] font-bold text-slate-600">Click để chọn file hoặc kéo thả</p>
                   <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ PDF, DOCX, PNG (Tối đa 50MB)</p>
                 </>
               )}
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-2xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all text-[14px] disabled:opacity-50 relative overflow-hidden"
            >
              {loading ? (
                <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center gap-2 relative z-10 text-[12px]">
                      <i className="fa-solid fa-spinner fa-spin"></i> Đang tải {uploadProgress.toFixed(0)}%
                    </span>
                    <div 
                        className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
              ) : (
                'Tải lên'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadSyllabusModal;
