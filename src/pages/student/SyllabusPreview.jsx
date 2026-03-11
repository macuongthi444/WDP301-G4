import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';
import { StorageUtils } from '../../utils/StorageUtils';

function SyllabusPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch student profile to get tutorId
        onValue(ref(db, `users/${user.uid}`), (snap) => {
          const profile = snap.val();
          setStudentProfile(profile);
          
          if (profile?.tutorId) {
             // Fetch specific syllabus
             onValue(ref(db, `syllabuses/${profile.tutorId}/${id}`), (sylSnap) => {
                setSyllabus(sylSnap.val());
                setLoading(false);
             });
          } else {
             // If tutorId is missing, check if it's on the user record directly
             const tutorId = profile?.tutorId || user.tutorId;
             if (tutorId) {
                onValue(ref(db, `syllabuses/${tutorId}/${id}`), (sylSnap) => {
                    setSyllabus(sylSnap.val());
                    setLoading(false);
                 });
             } else {
                setLoading(false);
             }
          }
        });
      } else {
        navigate('/login');
      }
    });
    return unsubAuth;
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="text-6xl mb-4">📂</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy tài liệu</h2>
        <p className="text-slate-500 mb-6">Tài liệu có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
        <button onClick={() => navigate('/student-dashboard')} className="bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg">
           Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen">
      <StudentNavbar activePage="syllabus" />
      
      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-black text-slate-900 mb-2">{syllabus.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[14px] text-slate-500 font-medium">
               <span className="flex items-center gap-1.5"><i className="fa-solid fa-book text-blue-500"></i> Môn học: <span className="text-slate-800 font-bold">{syllabus.subject}</span></span>
               <span className="flex items-center gap-1.5"><i className="fa-solid fa-graduation-cap text-purple-500"></i> Khối: <span className="text-slate-800 font-bold">{syllabus.grade}</span></span>
            </div>
          </div>
          
          <button 
            onClick={() => window.open(syllabus.fileUrl, '_blank')}
            className="bg-gradient-to-r from-[#4ef090] to-blue-500 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all text-[15px] flex items-center gap-3"
          >
            <i className="fa-solid fa-download"></i>
            Tải xuống
          </button>
        </div>

        {/* Details Cards Container */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 mb-6">
          <div className="space-y-8">
            {/* Overview Section */}
            <section>
              <h3 className="text-blue-500 font-bold text-[14px] uppercase tracking-widest mb-4">Tổng quan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="text-[15px]"><span className="text-slate-900 font-bold">File:</span> <span className="text-slate-600">{syllabus.name}</span></div>
                 <div className="text-[15px]"><span className="text-slate-900 font-bold">Upload:</span> <span className="text-slate-600">{new Date(syllabus.uploadDate).toLocaleDateString('vi-VN')}</span></div>
                 <div className="text-[15px]"><span className="text-slate-900 font-bold">Size:</span> <span className="text-slate-600">{syllabus.size || 'N/A'}</span></div>
              </div>
            </section>

            {/* Classes/Usage Section */}
            <section>
              <h3 className="text-blue-500 font-bold text-[14px] uppercase tracking-widest mb-4">Lớp học đã dùng</h3>
              <p className="text-[15px] text-slate-800 font-bold">{syllabus.subject} {syllabus.grade}</p>
            </section>

            {/* Notes Section */}
            <section>
              <h3 className="text-blue-500 font-bold text-[14px] uppercase tracking-widest mb-4">Ghi chú</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                {syllabus.notes || 'Không có ghi chú nào...'}
              </p>
            </section>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100">
          <h3 className="text-blue-500 font-bold text-[14px] uppercase tracking-widest mb-6">Xem trước</h3>
          <div className="w-full aspect-[4/3] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
             {syllabus.fileUrl?.includes('.pdf') ? (
                <iframe src={syllabus.fileUrl} className="w-full h-full border-none" title="Preview"></iframe>
             ) : StorageUtils.isImage(syllabus.name) || StorageUtils.isImage(syllabus.fileName) ? (
                <img 
                  src={syllabus.fileUrl} 
                  alt={syllabus.name} 
                  className="max-w-full max-h-full object-contain p-4 shadow-sm rounded-xl"
                />
             ) : (
                <div className="text-center p-10">
                   <i className="fa-solid fa-file-lines text-6xl text-slate-200 mb-4 block"></i>
                   <p className="text-slate-400 font-medium italic">Tài liệu này hiện không xem trước được. Vui lòng tải xuống để xem.</p>
                </div>
             )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default SyllabusPreview;
