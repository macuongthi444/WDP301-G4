import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL, uploadBytes, uploadBytesResumable, deleteObject } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';

function SubmitAssignmentModal({ isOpen, onClose, user, tutorId, scheduleId, date, assignmentId, existingSubmission }) {
  const [form, setForm] = useState({
    note: '',
    fileName: '',
    fileUrl: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setForm({
        note: existingSubmission.note || '',
        fileName: existingSubmission.fileName || '',
        fileUrl: existingSubmission.fileUrl || ''
      });
    } else {
      setForm({ note: '', fileName: '', fileUrl: '' });
    }
  }, [existingSubmission, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setForm(prev => ({ ...prev, fileName: selectedFile.name }));
    }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setForm(prev => ({ ...prev, fileName: '', fileUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalFileUrl = form.fileUrl;
      let finalFileName = form.fileName;

      if (file) {
        const fileRef = sRef(storage, `submissions/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        finalFileUrl = await getDownloadURL(snapshot.ref);
        finalFileName = file.name;
      }

      const submissionPath = `assignments/${tutorId}/${scheduleId}/${date}/${assignmentId}/submissions/${user.uid}`;
      await update(ref(db, submissionPath), {
        note: form.note,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        submittedAt: new Date().toISOString(),
        studentName: user.displayName || user.email // Fallback name
      });

      // Trigger Optimized Notification via Extension
      await OptimizedNotifService.sendNotification(
        tutorId,
        '📝 Bài tập mới!',
        `Học sinh ${user.displayName || 'ẩn danh'} đã nộp bài tập.`
      );

      alert('Đã nộp bài tập thành công!');
      onClose();
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      alert('Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài nộp này?')) return;
    setLoading(true);
    try {
      const submissionPath = `assignments/${tutorId}/${scheduleId}/${date}/${assignmentId}/submissions/${user.uid}`;
      await remove(ref(db, submissionPath));
      alert('Đã xóa bài nộp thành công!');
      onClose();
    } catch (error) {
       console.error("Lỗi khi xóa bài tập:", error);
       alert('Xóa bài tập thất bại.');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col z-10 border border-white">
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="px-10 pt-10 pb-6 text-center">
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                <i className="fa-solid fa-cloud-arrow-up"></i>
             </div>
             <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Nộp bài tập</h2>
             <p className="text-[13px] text-slate-400 font-bold mt-1">Đính kèm tệp và ghi chú cho Gia sư</p>
          </div>

          <div className="px-10 py-4 space-y-6">
             
             {/* File Upload */}
             <div>
                <input 
                  id="submit-file" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <label 
                  htmlFor="submit-file"
                  className={`border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer group block ${
                    form.fileName ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-400'
                  }`}
                >
                   <div className="space-y-3 relative">
                      {form.fileName && (
                         <button 
                            type="button"
                            onClick={handleRemoveFile}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                            title="Gỡ tệp"
                         >
                            <i className="fa-solid fa-xmark"></i>
                         </button>
                      )}
                      <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center transition-all ${
                        form.fileName ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-slate-300 group-hover:text-blue-500'
                      }`}>
                         <i className={form.fileName ? "fa-solid fa-file-circle-check" : "fa-solid fa-file-arrow-up text-xl"}></i>
                      </div>
                      {form.fileName ? (
                        <div className="px-4">
                           <p className="text-[14px] font-black text-slate-800 truncate mb-0.5">{form.fileName}</p>
                           <p className="text-[11px] text-blue-500 font-bold">Bấm để thay đổi tệp</p>
                        </div>
                      ) : (
                        <div>
                           <p className="text-[14px] font-black text-slate-500 group-hover:text-blue-500 transition-colors">Chọn tệp của bạn</p>
                           <p className="text-[11px] text-slate-400 font-medium">Hỗ trợ PDF, Hình ảnh, Zip...</p>
                        </div>
                      )}
                   </div>
                </label>
             </div>

             {/* Note */}
             <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lời nhắn</label>
                <textarea 
                  value={form.note}
                  onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Viết ghi chú gì đó cho Gia sư (nếu có)..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-[14px] text-slate-700 placeholder-slate-300 focus:bg-white focus:border-blue-400 outline-none transition-all h-32 resize-none"
                />
             </div>
          </div>

          <div className="px-10 py-8 bg-slate-50/50 flex flex-col gap-4 border-t border-slate-100">
             <div className="flex gap-4">
               <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 bg-white border border-slate-200 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all text-[14px] active:scale-95"
               >
                  Đóng
               </button>
               <button 
                  type="submit"
                  disabled={loading || !form.fileName}
                  className="flex-[1.5] bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all text-[14px] shadow-xl shadow-slate-900/10 disabled:opacity-50 active:scale-95"
               >
                  {loading ? 'Đang xử lý...' : (existingSubmission ? 'Cập nhật bài nộp' : 'Xác nhận nộp bài')}
               </button>
             </div>
             
             {existingSubmission && (
                <button 
                   type="button"
                   onClick={handleDelete}
                   disabled={loading}
                   className="w-full text-red-500 font-bold py-2 text-[12px] hover:text-red-600 transition-colors hover:bg-red-50 rounded-xl"
                >
                   Xóa bài nộp này
                </button>
             )}
          </div>

        </form>
      </div>
    </div>
  );
}

export default SubmitAssignmentModal;
