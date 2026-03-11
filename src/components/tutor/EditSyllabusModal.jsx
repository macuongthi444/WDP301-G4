import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValidationUtils } from '../../utils/ValidationUtils';
import { StorageUtils } from '../../utils/StorageUtils';

function EditSyllabusModal({ isOpen, onClose, userId, syllabusData, syllabusId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (isOpen && syllabusData) {
      setErrors({});
      setForm({
        name: syllabusData.name || '',
        grade: syllabusData.grade || '',
        subject: syllabusData.subject || '',
      });
      setSelectedFile(null);
      setUploadProgress(0);
    }
  }, [isOpen, syllabusData]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!ValidationUtils.validateName(form.name)) newErrors.name = 'Vui lòng nhập tên giáo trình';
    if (!form.subject) newErrors.subject = 'Vui lòng chọn môn học';
    if (!form.grade.trim()) newErrors.grade = 'Vui lòng nhập khối lớp';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const updates = {
        name: form.name,
        grade: form.grade,
        subject: form.subject,
        updatedAt: new Date().toISOString()
      };

      // Upload new file if selected
      if (selectedFile) {
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
              getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
                updates.fileUrl = url;
                updates.filePath = filePath;
                updates.fileName = selectedFile.name;
                updates.size = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
                updates.uploadDate = new Date().toISOString();

                // Optional: Delete old file if it exists and wasn't a placeholder dummy
                if (syllabusData.fileUrl && syllabusData.fileName && syllabusData.fileUrl !== '#') {
                   try {
                     const oldFileRef = storageRef(storage, `syllabuses/${userId}/${syllabusData.fileUrl.split('%2F').pop().split('?')[0]}`);
                     await deleteObject(oldFileRef);
                   } catch (e) {
                      console.log("Could not delete old file. It might be a direct link or already deleted.", e);
                   }
                }
                resolve();
              });
            }
          );
        });
      }

      await update(dbRef(db, `syllabuses/${userId}/${syllabusId}`), updates);
      
      setForm({ name: '', grade: '', subject: '' });
      setSelectedFile(null);
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({ form: 'Cập nhật thất bại: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá giáo trình này không? Hành động này không thể hoàn tác.')) return;
    
    setDeleting(true);
    try {
      // 1. Delete file from storage if it exists
      if (syllabusData.fileUrl && syllabusData.fileUrl !== '#') {
        try {
           // Extract filename from URL - rudimentary
           const extractedFileName = syllabusData.fileUrl.split('%2F').pop().split('?')[0];
           const fileRef = storageRef(storage, `syllabuses/${userId}/${extractedFileName}`);
           await deleteObject(fileRef);
        } catch(e) {
           console.log("Could not delete file from storage during full delete.", e);
        }
      }

      // 2. Delete entry from Realtime Database
      await remove(dbRef(db, `syllabuses/${userId}/${syllabusId}`));

      alert('Đã xoá giáo trình thành công!');
      navigate('/syllabus');
    } catch (error) {
       alert('Xoá giáo trình thất bại: ' + error.message);
    } finally {
       setDeleting(false);
       onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white px-8 pt-8 pb-4 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 text-center">Cập nhật giáo trình</h2>
        </div>

        {/* Body */}
        <div className="px-8 pb-4 overflow-y-auto custom-scrollbar flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <label className="text-[13px] font-semibold text-slate-700 w-[100px] shrink-0">Tên giáo trình:</label>
              <input 
                type="text" 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Ví dụ: Toán lớp 6" 
                className={`w-full border ${errors.name ? 'border-red-500' : 'border-slate-300'} rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-500 outline-none transition-colors`}
                required
              />
            </div>
            {errors.name && <p className="text-[11px] text-red-500 font-bold ml-[112px] -mt-4 mb-2">{errors.name}</p>}

            <div className="flex items-center gap-3">
              <label className="text-[13px] font-semibold text-slate-700 w-[100px] shrink-0">Môn học:</label>
              <div className="relative w-full">
                <select 
                  className={`w-full border ${errors.subject ? 'border-red-500' : 'border-slate-300'} rounded-lg py-2.5 px-3 pr-8 text-sm text-slate-800 bg-slate-100/80 focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer`}
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  required
                >
                    <option value="" disabled>Chọn môn học...</option>
                    {defaultSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {!defaultSubjects.includes(form.subject) && form.subject && (
                      <option value={form.subject}>{form.subject}</option>
                    )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                    <i className="fa-solid fa-chevron-down"></i>
                </div>
              </div>
            </div>
            {errors.subject && <p className="text-[11px] text-red-500 font-bold ml-[112px] -mt-4 mb-2">{errors.subject}</p>}

            <div className="flex items-center gap-3">
               <div className="w-[100px] shrink-0"></div>
                <input 
                  type="text" 
                  value={form.grade}
                  onChange={(e) => setForm({...form, grade: e.target.value})}
                  placeholder="Khối lớp (VD: 6, 7, 8...)" 
                  className={`w-full border ${errors.grade ? 'border-red-500' : 'border-slate-300'} rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-500 outline-none transition-colors`}
                  required
                />
            </div>
            {errors.grade && <p className="text-[11px] text-red-500 font-bold ml-[112px] -mt-4 mb-2">{errors.grade}</p>}
            {errors.form && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold mb-2">{errors.form}</div>}

            <div className="flex flex-col gap-2 pt-2">
               <label className="text-[13px] font-bold text-blue-600">Thay thế file đính kèm (Tuỳ chọn):</label>
               <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, image/*"
                  className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
               />
               {!selectedFile && syllabusData.fileName && (
                  <p className="text-[12px] text-slate-500 italic mt-1">File hiện tại: <b>{syllabusData.fileName}</b></p>
               )}
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 mt-4 overflow-hidden relative">
                    <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 absolute left-0 top-0" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={loading || deleting}
            className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Đang xoá...' : 'Xoá'}
          </button>
          
          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               disabled={loading || deleting}
               className="px-6 py-2.5 bg-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-300 transition-colors"
             >
               Huỷ
             </button>
             <button 
               type="button"
               onClick={handleUpdate}
               disabled={loading || deleting}
               className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-sm font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
             >
               {loading ? 'Đang lưu...' : 'Cập nhật'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSyllabusModal;
