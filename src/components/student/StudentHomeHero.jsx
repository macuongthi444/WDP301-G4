import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentHomeHero({ displayName, studentProfile, user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hasTodaySession: false,
    totalSessions: 0,
    lastEval: 0,
    pendingHomework: 0,
    loading: true
  });

  useEffect(() => {
    if (!user || !studentProfile || !studentProfile.tutorId) return;

    const tutorId = studentProfile.tutorId;
    const myName = studentProfile.name?.toLowerCase().trim();

    // 1. Fetch Schedules (Today's class)
    const schedulesRef = ref(db, `schedules/${tutorId}`);
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      let hasToday = false;
      if (data) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayDay = dayNames[now.getDay()];

        Object.values(data).forEach(s => {
          const isMySchedule = s.studentId === user.uid || 
                               s.selectedStudents?.some(name => name.toLowerCase().trim() === myName);
          
          if (isMySchedule) {
            if (s.scheduleType === 'weekly') {
              if (s.selectedDays?.includes(todayDay)) {
                const start = s.startDate ? new Date(s.startDate) : null;
                const end = s.endDate ? new Date(s.endDate) : null;
                if ((!start || start <= now) && (!end || end >= now)) {
                  if (!s.deletedDates?.includes(todayStr)) hasToday = true;
                }
              }
            } else {
              if (s.startDate === todayStr) hasToday = true;
            }
          }
        });
      }
      setStats(prev => ({ ...prev, hasTodaySession: hasToday }));
    });

    // 2. Fetch Attendance (Total sessions & Last eval)
    const attRef = ref(db, `attendance/${tutorId}`);
    onValue(attRef, (snap) => {
      let total = 0;
      let lastEvaluationValue = 0;
      let lastDate = "";

      if (snap.exists()) {
        const allAttendance = snap.val();
        Object.values(allAttendance).forEach(scheduleDates => {
          Object.entries(scheduleDates).forEach(([dateStr, sessionData]) => {
            const studentData = sessionData.students?.[studentProfile.name];
            if (studentData && studentData.status === 'present') {
              total++;
              // Keep track of the most recent evaluation
              if (dateStr > lastDate) {
                lastDate = dateStr;
                const e1 = studentData.eval_consciousness || 0;
                const e2 = studentData.eval_progress || 0;
                const e3 = studentData.eval_thinking || 0;
                if (e1 > 0 || e2 > 0 || e3 > 0) {
                  lastEvaluationValue = Math.round(((e1 + e2 + e3) / 15) * 100);
                }
              }
            }
          });
        });
      }
      setStats(prev => ({ ...prev, totalSessions: total, lastEval: lastEvaluationValue }));
    });

    // 3. Fetch Pending Assignments
    const assignRef = ref(db, `assignments/${tutorId}`);
    onValue(assignRef, (snap) => {
      let pending = 0;
      if (snap.exists()) {
        const tutorAssignments = snap.val();
        Object.values(tutorAssignments).forEach(scheduleAssigns => {
          Object.values(scheduleAssigns).forEach(dateAssigns => {
            Object.values(dateAssigns).forEach(assignment => {
              const isMyAssignment = assignment.selectedStudents?.some(name => name.toLowerCase().trim() === myName);
              if (isMyAssignment) {
                const hasSubmission = assignment.submissions?.[user.uid];
                if (!hasSubmission) pending++;
              }
            });
          });
        });
      }
      setStats(prev => ({ ...prev, pendingHomework: pending, loading: false }));
    });

  }, [user, studentProfile]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-r from-[#4ef090] to-blue-500 min-h-[500px] flex items-center">
        
        {/* Absolute positioned image to match the Figma mockup: girl on the far left */}
        <div className="absolute bottom-0 left-[-5%] lg:left-[5%] h-[85%] z-0 pointer-events-none opacity-90 md:opacity-100">
             <img src="/assent/women with tab 1.png" alt="Student" className="h-full object-contain drop-shadow-2xl opacity-70 blur-[2px]" />
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 relative z-10 h-full flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Lft Block: Image + Text */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 relative z-20">
             <img src="/assent/women with tab 1.png" alt="Student" className="h-[250px] md:h-[350px] lg:h-[400px] object-contain drop-shadow-2xl opacity-0 md:opacity-0 hidden" /> {/* Hidden spacer to keep layout if needed, though absolute image handles the visual */}
            
             <div className="text-white text-center md:text-left drop-shadow-xl md:pl-[350px] lg:pl-[420px]">
              <h1 className="text-[32px] md:text-[40px] font-extrabold leading-tight mb-8 drop-shadow-lg">
                Chào {displayName} 👋,<br />
                {stats.hasTodaySession ? (
                  <>Hôm nay bạn có lịch<br />học</>
                ) : (
                  <>Hôm nay bạn được<br />nghỉ</>
                )}
              </h1>
              <button
                onClick={() => navigate('/student-schedule')}
                className="bg-white text-blue-600 font-bold px-8 py-3 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all text-[15px]"
              >
                Xem chi tiết
              </button>
            </div>
          </div>

          {/* Right Block: Stats Card */}
          <div className="flex justify-center md:justify-end w-full md:w-auto relative z-20 mt-6 md:mt-0">
            <div className="bg-white rounded-[24px] p-8 shadow-2xl w-full max-w-sm transform hover:scale-[1.02] transition-transform">
              <h3 className="text-slate-800 text-[15px] font-extrabold mb-6 tracking-tight">Tổng Quan Hệ Thống</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center group cursor-pointer">
                  <span className="text-slate-500 font-medium text-[13px] group-hover:text-blue-500 transition-colors">Tổng số buổi đã học</span>
                  <span className="text-[20px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{stats.totalSessions}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] font-medium text-slate-500">Đánh giá buổi học gần nhất</span>
                    <span className="text-[14px] font-black text-blue-500">{stats.lastEval}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] relative overflow-hidden transition-all duration-500" style={{ width: `${stats.lastEval}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-5 group cursor-pointer" onClick={() => navigate('/student-schedule')}>
                  <span className="text-[20px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{stats.pendingHomework} bài</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features specific to student banner */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h2 className="text-[20px] font-bold text-slate-800 mb-10">Gia sư hiện đại cần nhiều hơn một cuốn sổ tay</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white py-4 px-6 rounded-2xl shadow-sm text-[13px] text-slate-600 font-medium flex items-center justify-center gap-2 border border-slate-100 text-center">
              <span className="text-red-500 font-bold">✖</span> Chỉ nhớ rải rác, khó theo dõi tiến độ
            </div>
            <div className="bg-white py-4 px-6 rounded-2xl shadow-sm text-[13px] text-slate-600 font-medium flex items-center justify-center gap-2 border border-slate-100 text-center">
              <span className="text-red-500 font-bold">✖</span> Phụ huynh không biết con đã học hay chưa
            </div>
            <div className="bg-white py-4 px-6 rounded-2xl shadow-sm text-[13px] text-slate-600 font-medium flex items-center justify-center gap-2 border border-slate-100 text-center">
              <span className="text-red-500 font-bold">✖</span> Mất thời gian soạn bài tập mỗi tuần
            </div>
          </div>
        </div>
      </section>
      
      {/* Features (Same as Tutor) */}
      <section className="py-16 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Tính năng nổi bật</h2>
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-12">
            <div className="flex-1">
              <h3 className="text-xl text-slate-900 mb-3 flex items-center gap-2 font-bold">
                <i className="fa-solid fa-bolt text-blue-500"></i> Điểm danh &amp; Tự động thông báo
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">Mỗi buổi học, gia sư chỉ cần bấm "Điểm danh".<br />Hệ thống sẽ tự động gửi thông báo cho phụ huynh.</p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Thao tác tính toán nhanh</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tích hợp tính năng đánh giá</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Gửi email, thông báo trực tiếp</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-[380px] border border-slate-100">
                <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-yellow-400 shrink-0 text-sm"><i className="fa-solid fa-bell"></i></div>
                  <div className="text-sm">
                    <strong className="text-slate-900 block mb-0.5">Thông báo điểm số</strong>
                    <span className="text-slate-500">Bạn có kết quả bài kiểm tra môn Toán hôm nay.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row-reverse items-center justify-between mb-12 gap-12">
            <div className="flex-1">
              <h3 className="text-xl text-slate-900 mb-3 flex items-center gap-2 font-bold">
                <i className="fa-solid fa-robot text-purple-600"></i> AI Tạo Bài Tập Tự Động
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">Chỉ cần nhập câu lệnh,<br />AI sẽ tạo bài tập phù hợp với trình độ học sinh.</p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tải bài tập tự động, chính xác</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Đa dạng hình thức trắc nghiệm</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tương tác theo hướng dẫn học sinh</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-[380px] border border-slate-100">
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[80%]"></div>
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[60%]"></div>
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[90%]"></div>
                <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 py-2 px-4 rounded-full text-xs font-semibold mt-3">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Tạo bài tập mới
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Cách Sổ tay Gia sư hoạt động</h2>
          <p className="text-sm text-slate-500 mb-12">Minh bạch buổi học chỉ với 3 bước đơn giản</p>
          <div className="flex flex-col md:flex-row items-start justify-center gap-6 relative">
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">1</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Gia sư tạo buổi học</h4>
              <p className="text-slate-500 text-xs">Tạo lớp và nhận buổi học dễ dàng ra.</p>
            </div>
            <div className="hidden md:block w-20 h-0.5 bg-slate-200 mt-5 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">2</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Điểm danh &amp; ghi chú</h4>
              <p className="text-slate-500 text-xs">Điểm danh học sinh, ghi nhận điểm tích<br />và hiệu bài tập bằng AI.</p>
            </div>
            <div className="hidden md:block w-20 h-0.5 bg-slate-200 mt-5 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">3</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Phụ huynh nhận thông báo</h4>
              <p className="text-slate-500 text-xs">Hệ thống tự động gửi thông báo vào<br />nhận xem đã biết.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default StudentHomeHero;
