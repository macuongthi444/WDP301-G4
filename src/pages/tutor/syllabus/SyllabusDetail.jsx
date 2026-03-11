import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import EditSyllabusModal from '../../../components/tutor/EditSyllabusModal';
import { StorageUtils } from '../../../utils/StorageUtils';

function SyllabusDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [usedClasses, setUsedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchSyllabusData(currentUser.uid, id);
        fetchUsedClasses(currentUser.uid, id);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [id, navigate]);

  const fetchSyllabusData = (uid, syllabusId) => {
    const syllabusRef = ref(db, `syllabuses/${uid}/${syllabusId}`);
    onValue(syllabusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSyllabus(data);
      }
      setLoading(false);
    });
  };

  const fetchUsedClasses = (uid, syllabusId) => {
    const classesRef = ref(db, `classes/${uid}`);
    onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linked = Object.entries(data)
          .filter(([_, c]) => c.curriculum === syllabusId)
          .map(([cid, c]) => ({ id: cid, ...c }));
        setUsedClasses(linked);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc]">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!syllabus) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] p-6 text-center">
      <div className="text-6xl mb-6">📂</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Không tìm thấy giáo trình</h2>
      <p className="text-slate-500 mb-8 max-w-md font-medium">Giáo trình này có thể đã bị xóa hoặc đường dẫn không còn chính xác.</p>
      <button onClick={() => navigate('/syllabus')} className="bg-blue-600 text-white font-black px-10 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
        Quay lại danh sách
      </button>
    </div>
  );

  return (
    <div className="bg-[#f8f9fc] min-h-screen">
      <TutorNavbar activePage="syllabus" />

      <main className="pt-24 pb-16 px-6 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/syllabus')}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-500 font-bold mb-6 transition-colors group"
        >
          <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
          Quay lại Thư viện giáo trình
        </button>

        {/* Header Section (Student-style Gradient Card) */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 lg:p-10 shadow-[0_2px_30px_rgba(0,0,0,0.02)] border border-slate-100 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 flex-1 min-w-0">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl shadow-sm border border-blue-100/50 shrink-0">
              <i className={`fa-solid ${syllabus.fileName?.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-lines'}`}></i>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-[32px] font-black text-slate-900 leading-tight mb-2 break-all" title={syllabus.name}>{syllabus.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[14px] font-bold">
                <span className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
                  <i className="fa-solid fa-book text-blue-500"></i> {syllabus.subject}
                </span>
                <span className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
                  <i className="fa-solid fa-graduation-cap text-purple-500"></i> Khối {syllabus.grade}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full sm:w-auto bg-slate-50 text-slate-600 font-black px-6 py-4 rounded-2xl hover:bg-slate-100 transition-all text-[15px] border border-slate-200 whitespace-nowrap"
            >
              <i className="fa-solid fa-pen-to-square mr-2"></i> Chỉnh sửa
            </button>
            <button
              onClick={() => window.open(syllabus.fileUrl, '_blank')}
              className="w-full sm:w-auto bg-gradient-to-r from-[#4ef090] to-[#3b82f6] text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-[15px] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="fa-solid fa-download"></i>
              Tải xuống
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Detailed Info (Left) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Overview Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
              <h3 className="text-blue-500 font-black text-[12px] uppercase tracking-widest mb-6">Thông tin chi tiết</h3>
              <div className="space-y-6">
                <div className="group">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Tên file gốc</p>
                  <p className="text-[15px] text-slate-800 font-bold truncate">{syllabus.fileName || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Ngày tải lên</p>
                  <p className="text-[15px] text-slate-800 font-bold">{new Date(syllabus.uploadDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Dung lượng</p>
                  <p className="text-[15px] text-slate-800 font-bold">{syllabus.size || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Usage Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
              <h3 className="text-purple-500 font-black text-[12px] uppercase tracking-widest mb-6">Lớp học hiện tại</h3>
              <div className="space-y-3">
                {usedClasses.length > 0 ? usedClasses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => navigate(`/class-detail/${c.id}`)}>
                    <span className="text-[14px] font-bold text-slate-700">{c.name}</span>
                    <i className="fa-solid fa-chevron-right text-slate-300 text-xs group-hover:text-blue-500 transition-colors"></i>
                  </div>
                )) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium italic">Chưa gắn vào lớp nào.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
              <h3 className="text-emerald-500 font-black text-[12px] uppercase tracking-widest mb-4">Ghi chú cá nhân</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 italic min-h-[100px]">
                {syllabus.notes || 'Không có ghi chú nào cho giáo trình này...'}
              </p>
            </div>
          </div>

          {/* Preview (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_30px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col min-h-[700px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-blue-500 font-black text-[12px] uppercase tracking-widest">Xem trước tài liệu</h3>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info"></i> Chỉ xem trước file PDF
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden min-h-[400px]">
                {syllabus.fileUrl?.includes('.pdf') ? (
                  <iframe src={syllabus.fileUrl} className="w-full h-full border-none" title="Tutor Preview"></iframe>
                ) : (
                  <div className="text-center max-w-sm px-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm border border-slate-50">
                      <i className="fa-solid fa-file-circle-exclamation text-3xl"></i>
                    </div>
                    <h4 className="text-[16px] font-black text-slate-800 mb-2">Không thể xem trước</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                      Hiện tại hệ thống chỉ hỗ trợ xem trước định dạng PDF. Bạn hãy tải xuống để kiểm tra chi tiết hoặc đổi sang file PDF để xem nhanh hơn nhé!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>

      <Footer />

      {user && syllabus && (
        <EditSyllabusModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={user.uid}
          syllabusId={id}
          syllabusData={syllabus}
        />
      )}
    </div>
  );
}

export default SyllabusDetail;
