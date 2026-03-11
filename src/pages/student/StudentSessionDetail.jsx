import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';
import SubmitAssignmentModal from '../../components/student/SubmitAssignmentModal';

function StudentSessionDetail() {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tutorId, setTutorId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // 1. Fetch user record from /users/${uid}
          const userRef = ref(db, `users/${currentUser.uid}`);
          const userSnap = await get(userRef);
          
          if (userSnap.exists()) {
            let userData = userSnap.val();
            let { tutorId, studentId } = userData;

            // --- DEEP SEARCH FALLBACK ---
            if (!tutorId || !studentId) {
               const allStudentsSnap = await get(ref(db, 'students'));
               if (allStudentsSnap.exists()) {
                  const allTutorsData = allStudentsSnap.val();
                  for (const [tId, studentsList] of Object.entries(allTutorsData)) {
                     for (const [sId, studentObj] of Object.entries(studentsList)) {
                        if (studentObj.studentAuthId === currentUser.uid) {
                           tutorId = tId;
                           studentId = sId;
                           await update(userRef, { tutorId, studentId });
                           break;
                        }
                     }
                     if (tutorId) break;
                  }
               }
            }
            
            if (tutorId && studentId) {
              setTutorId(tutorId);
              setStudentId(studentId);
              
              // 2. Fetch student profile
              onValue(ref(db, `students/${tutorId}/${studentId}`), (snap) => {
                setStudentProfile(snap.val());
              });

              // 3. Fetch session data
              onValue(ref(db, `schedules/${tutorId}/${id}`), (snap) => {
                setSession(snap.val());
              });

              // 4. Fetch attendance & evaluation
              onValue(ref(db, `attendance/${tutorId}/${id}/${date}`), (snap) => {
                setAttendance(snap.val());
              });

              // 5. Fetch assignments
              onValue(ref(db, `assignments/${tutorId}/${id}/${date}`), (snap) => {
                const data = snap.val();
                if (data) {
                  setAssignments(Object.entries(data).map(([aid, val]) => ({ id: aid, ...val })));
                } else {
                  setAssignments([]);
                }
              });
              
              setLoading(false);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching session detail:", error);
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [id, date, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return <div className="p-10 text-center text-slate-500">Buổi học không tồn tại.</div>;

  const displayDate = date.split('-').reverse().join('/');
  
  // Find my specific attendance data
  const myAttendance = (attendance?.students && studentProfile?.name) 
    ? attendance.students[studentProfile.name] 
    : (attendance?.status ? attendance : null); // legacy fallback

  // Attendance Status Logic
  const getAttendanceStatus = () => {
    const now = new Date();
    const sessionDateMidnight = new Date(date);
    sessionDateMidnight.setHours(23, 59, 59, 999);
    
    if (myAttendance?.status === 'present') {
      return { label: 'Có mặt', status: 'present', sub: 'Cập nhật bởi Gia sư', icon: '✅', color: 'bg-emerald-50 border-emerald-500 text-emerald-700' };
    } else if (myAttendance?.status === 'absent') {
      return { label: 'Vắng mặt', status: 'absent', sub: 'Cập nhật bởi Gia sư', icon: '❌', color: 'bg-red-50 border-red-500 text-red-700' };
    } else {
      // Not marked by tutor yet
      if (now > sessionDateMidnight) {
        return { label: 'Vắng mặt', status: 'absent', sub: 'Tự động đánh vắng', icon: '❌', color: 'bg-red-50 border-red-500 text-red-700' };
      } else {
        return { label: 'Chưa học', status: 'pending', sub: 'Chờ điểm điểm danh', icon: '⏳', color: 'bg-slate-50 border-slate-300 text-slate-500' };
      }
    }
  };

  const attStatus = getAttendanceStatus();

  const StarRating = ({ value }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`fa-solid fa-star text-sm ${star <= value ? 'text-amber-400' : 'text-slate-200'}`}></i>
      ))}
    </div>
  );

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  return (
    <>
      <StudentNavbar activePage="dashboard" />

      <main className="pt-[80px] min-h-screen bg-[#f8f9fc]">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-blue-500 transition-all hover:shadow-md active:scale-95"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Chi tiết buổi học</h1>
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ngày {displayDate}</p>
              </div>
            </div>
            
            {session.link && (
              <a 
                href={session.link} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-[14px] flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-video"></i>
                Vào lớp học
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Session Info & Assignments */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Session Overview Card */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-[18px] font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                       <i className="fa-solid fa-info-circle text-sm"></i>
                    </div>
                    Thông tin lớp học
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-8">
                    <div className="space-y-6">
                       <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Môn học</p>
                          <p className="text-[16px] font-bold text-slate-800">{session.subject || session.className}</p>
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                          <p className="text-[16px] font-bold text-slate-800">{session.startTime} - {session.endTime}</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Hình thức</p>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${
                            session.teachingMode === 'online' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            <i className={session.teachingMode === 'online' ? "fa-solid fa-globe" : "fa-solid fa-house-user"}></i>
                            {session.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
                          </span>
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Giáo trình</p>
                          <p className="text-[16px] font-bold text-slate-800 truncate">{session.curriculumName || 'Theo chương trình chuẩn'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Assignments Section */}
              <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-[18px] font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                       <i className="fa-solid fa-book-open text-sm"></i>
                    </div>
                    Bài tập về nhà
                 </h3>
                 
                 <div className="space-y-4">
                    {assignments.length > 0 ? assignments.filter(a => !a.selectedStudents || !studentProfile?.name || a.selectedStudents.some(s => s.toLowerCase().trim() === studentProfile.name.toLowerCase().trim())).map((assignment) => {
                      const submission = assignment.submissions?.[user?.uid];
                      return (
                        <div key={assignment.id} className="p-6 rounded-2xl border border-slate-100 bg-[#f8f9fc] hover:border-blue-200 transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{assignment.title}</h4>
                                 <p className="text-[12px] text-slate-500 mt-1">{assignment.description || 'Không có mô tả chi tiết.'}</p>
                                 
                                 {submission && (
                                   <div className="mt-4 space-y-3">
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                                         <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                               <i className="fa-solid fa-file-circle-check text-sm"></i>
                                            </div>
                                            <div className="min-w-0">
                                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Bài làm của bạn:</p>
                                               <a 
                                                 href={submission.fileUrl} 
                                                 target="_blank" 
                                                 rel="noreferrer" 
                                                 className="text-[13px] font-bold text-blue-600 hover:underline truncate block"
                                               >
                                                  {submission.fileName || 'Tệp bài làm'}
                                               </a>
                                            </div>
                                         </div>
                                         {submission.grade !== undefined && submission.grade !== '' && (
                                            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg shadow-blue-500/20 shrink-0">
                                               <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none mb-0.5">Điểm</p>
                                               <p className="text-[14px] font-black leading-none">{submission.grade}/10</p>
                                            </div>
                                         )}
                                      </div>
                                      
                                      {(submission.note || submission.feedback) && (
                                         <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2">
                                            {submission.note && (
                                               <p className="text-[11px] text-slate-400 italic">
                                                  <span className="font-black uppercase not-italic mr-1 text-[9px] opacity-70">Ghi chú của bạn:</span>
                                                  "{submission.note}"
                                               </p>
                                            )}
                                            {submission.feedback && (
                                               <p className="text-[11px] text-blue-600 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                  <span className="font-black uppercase mr-1 text-[9px] opacity-70">Gia sư nhận xét:</span>
                                                  {submission.feedback}
                                               </p>
                                            )}
                                         </div>
                                      )}
                                   </div>
                                 )}
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                submission ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {submission ? 'Đã nộp' : 'Chưa nộp'}
                              </span>
                           </div>
                           
                           <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                              <div className="flex items-center gap-6">
                                 <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-bold">
                                    <i className="fa-regular fa-calendar"></i>
                                    {assignment.dueDate ? assignment.dueDate.split('-').reverse().join('/') : 'N/A'}
                                 </div>
                                 {assignment.fileUrl && (
                                    <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-500 text-[12px] font-black hover:underline">
                                       <i className="fa-solid fa-paperclip"></i>
                                       Tài liệu
                                    </a>
                                 )}
                              </div>
                              
                              <button 
                                onClick={() => handleOpenSubmit(assignment)}
                                className={`px-5 py-2 rounded-xl text-[12px] font-black transition-all ${
                                  submission ? 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
                                }`}
                              >
                                {submission ? 'Sửa bài nộp' : 'Nộp bài ngay'}
                              </button>
                           </div>
                        </div>
                      );
                    }) : (
                      <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                         <i className="fa-solid fa-mug-hot text-xl mb-3 block"></i>
                         <p className="text-[13px] font-bold">Không có bài tập cho buổi học này.</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Right Column: Attendance & Evaluation */}
            <div className="space-y-6">
               
               {/* Attendance Status */}
               <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Điểm danh</h3>
                 <div className={`p-6 rounded-[24px] text-center border-l-8 ${attStatus.color}`}>
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl bg-white shadow-sm">
                       {attStatus.icon}
                    </div>
                    <p className="text-[18px] font-black">{attStatus.label}</p>
                    <p className="text-[12px] font-medium mt-1 opacity-70">{attStatus.sub}</p>
                 </div>
                 
                 {myAttendance?.note && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhận xét từ gia sư</p>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[13px] text-slate-600 leading-relaxed italic">"{myAttendance.note}"</p>
                       </div>
                    </div>
                 )}
               </div>

               {/* Star Rating Card */}
               <div className="bg-white rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6">Đánh giá buổi học</h3>
                 <div className="space-y-5">
                    <div className="flex items-center justify-between">
                       <span className="text-[14px] font-bold text-slate-600">Ý thức</span>
                       <StarRating value={myAttendance?.eval_consciousness || 0} />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[14px] font-bold text-slate-600">Tiến bộ</span>
                       <StarRating value={myAttendance?.eval_progress || 0} />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[14px] font-bold text-slate-600">Tư duy</span>
                       <StarRating value={myAttendance?.eval_thinking || 0} />
                    </div>
                 </div>
                 <p className="text-[11px] text-slate-400 mt-8 text-center font-medium">Bạn có thắc mắc về đánh giá? <br/> Hãy nhắn tin trực tiếp cho Gia sư nhé!</p>
               </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
      
      {user && studentProfile && selectedAssignment && (
        <SubmitAssignmentModal 
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          user={user}
          tutorId={tutorId}
          scheduleId={id}
          date={date}
          assignmentId={selectedAssignment.id}
          existingSubmission={selectedAssignment.submissions?.[user.uid]}
        />
      )}
    </>
  );
}

export default StudentSessionDetail;
