import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';
import FileThumbnail from '../../components/shared/FileThumbnail';

function StudentSyllabus() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const userRef = ref(db, `users/${currentUser.uid}`);
          const userSnap = await get(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.val();
            const { tutorId, studentId } = userData;

            if (tutorId && studentId) {
              // Fetch profile
              const profileRef = ref(db, `students/${tutorId}/${studentId}`);
              const profileSnap = await get(profileRef);
              const sProfile = profileSnap.val() || userData;
              setStudentProfile(sProfile);

              // 1. Fetch Classes to see enrollment
              onValue(ref(db, `classes/${tutorId}`), (classesSnap) => {
                const classesData = classesSnap.val() || {};
                const enrolledGrades = new Set();
                const enrolledCurriculumIds = new Set();

                Object.values(classesData).forEach(c => {
                  if (c.selectedStudents?.includes(sProfile.name)) {
                    if (c.grade) enrolledGrades.add(c.grade);
                    if (c.curriculum) enrolledCurriculumIds.add(c.curriculum);
                  }
                });

                // 2. Fetch Syllabus
                onValue(ref(db, `syllabuses/${tutorId}`), (snapshot) => {
                  const data = snapshot.val();
                  if (data) {
                    const list = Object.entries(data).map(([id, val]) => ({
                      id, ...val
                    })).filter(item => {
                      if (enrolledCurriculumIds.has(item.id)) return true;
                      return enrolledGrades.has(item.grade) || item.grade === sProfile.grade;
                    });
                    setMaterials(list);
                  } else {
                    setMaterials([]);
                  }
                  setLoading(false);
                });
              });
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching syllabus:", error);
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-[#f8f9fc] min-h-screen flex flex-col">
      <StudentNavbar activePage="syllabus" />
      
      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 mt-1">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <div>
              <h1 className="text-[28px] font-black text-slate-900 leading-tight">
                Giáo trình & Tài liệu
              </h1>
              <p className="text-slate-500 font-medium mt-2">Tất cả tài liệu học tập được Gia sư chỉ định riêng cho bạn.</p>
            </div>
          </div>

          {/* Materials List */}
          <div className="bg-white rounded-[32px] shadow-[0_2px_30px_rgba(0,0,0,0.02)] p-10 border border-slate-100">
            <div className="grid grid-cols-1 gap-4">
              {materials.length > 0 ? materials.map((file) => (
                <div 
                  key={file.id} 
                  onClick={() => navigate(`/student/syllabus/${file.id}`)}
                  className="flex flex-col sm:flex-row items-center sm:items-center justify-between border border-slate-100 rounded-2xl p-5 md:px-8 hover:border-blue-400 hover:bg-blue-50/20 transition-all bg-white cursor-pointer group shadow-sm hover:shadow-md gap-4"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
                     <FileThumbnail 
                        filePath={file.filePath}
                        fileName={file.fileName}
                        fileUrl={file.fileUrl}
                        className="w-12 h-12 rounded-2xl"
                     />
                     <div className="min-w-0">
                        <span className="text-[16px] text-slate-800 font-black block group-hover:text-blue-600 transition-colors truncate">{file.name}</span>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-0.5">
                           <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] text-slate-500 font-bold uppercase">{file.subject}</span>
                           <span className="hidden sm:inline text-slate-300">•</span>
                           <span className="text-[12px] text-slate-400 font-bold">Khối {file.grade} • {file.size || 'N/A'}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(file.fileUrl, '_blank'); }}
                      className="flex-1 sm:flex-none text-blue-500 font-black text-[13px] hover:text-white px-6 py-2.5 bg-blue-50 rounded-xl hover:bg-blue-500 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-download"></i>
                      Tải xuống
                    </button>
                    <div className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                      <i className="fa-solid fa-chevron-right text-sm"></i>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <i className="fa-solid fa-folder-open text-3xl"></i>
                   </div>
                   <p className="text-slate-400 font-bold text-[16px]">Hiện tại chưa có tài liệu nào dành cho bạn.</p>
                   <p className="text-slate-300 text-sm mt-1 font-medium">Bạn có thể liên hệ với Gia sư để được cấp thêm tài liệu học tập.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default StudentSyllabus;
