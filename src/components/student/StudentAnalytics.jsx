import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentAnalytics({ studentProfile, tutorProfile, user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Lớp học trong tuần', value: '0' },
    { label: 'Bài tập đã nộp', value: '0' },
    { label: 'Điểm số trung bình', value: '0.0' },
  ]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !studentProfile || !studentProfile.tutorId) {
      if (studentProfile && !studentProfile.tutorId) setLoading(false);
      return;
    }

    const tutorId = studentProfile.tutorId;

    // 1. Fetch Classes to see which ones the student is enrolled in
    const classesRef = ref(db, `classes/${tutorId}`);
    onValue(classesRef, (classesSnap) => {
       const classesData = classesSnap.val() || {};
       const enrolledClassNames = [];
       const enrolledGrades = new Set();
       const enrolledCurriculumIds = new Set();

       const myName = studentProfile.name.toLowerCase().trim();

       Object.values(classesData).forEach(c => {
          // Check by name or explicitly by studentAuthId if available
          const isStudentInClass = c.selectedStudents?.some(s => s.toLowerCase().trim() === myName);
          
          if (isStudentInClass) {
             enrolledClassNames.push(c.name);
             if (c.grade) enrolledGrades.add(c.grade);
             if (c.curriculum) enrolledCurriculumIds.add(c.curriculum);
          }
       });

       // 2. Fetch Syllabus (Filtered by Class Grade OR Curriculum ID)
       const syllabusRef = ref(db, `syllabuses/${tutorId}`);
       onValue(syllabusRef, (snapshot) => {
         const data = snapshot.val();
         if (data) {
           const list = Object.entries(data).map(([id, val]) => ({
             id,
             ...val
           })).filter(item => {
              // Priority 1: Direct link via class's curriculum field
              if (enrolledCurriculumIds.has(item.id)) return true;
              
              // Priority 2: Generic match by grade if specified
              const matchesGrade = enrolledGrades.has(item.grade) || item.grade === studentProfile.grade;
              return matchesGrade;
           });
           setMaterials(list);
         } else {
           setMaterials([]);
         }
       });

       // 3. Fetch Schedules for this week
       const schedulesRef = ref(db, `schedules/${tutorId}`);
       onValue(schedulesRef, (snapshot) => {
         const data = snapshot.val();
         let classesThisWeek = 0;
         if (data) {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); // Monday
            startOfWeek.setHours(0,0,0,0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
            endOfWeek.setHours(23,59,59,999);

             Object.values(data).forEach(schedule => {
                const isMySchedule = schedule.studentId === user.uid || 
                                     (schedule.selectedStudents?.some(s => s.toLowerCase().trim() === myName)) ||
                                     (enrolledClassNames.includes(schedule.className));
                
                if (isMySchedule) {
                   if (schedule.scheduleType === 'weekly') {
                      // Stats for this week
                      if ((!schedule.startDate || new Date(schedule.startDate) <= endOfWeek) && 
                          (!schedule.endDate || new Date(schedule.endDate) >= startOfWeek)) {
                         classesThisWeek += (schedule.selectedDays?.length || 0);
                      }
                   } else {
                      // Stats for this week
                      const sDate = new Date(schedule.startDate);
                      if (sDate >= startOfWeek && sDate <= endOfWeek) {
                         classesThisWeek++;
                      }
                   }
                }
             });
          }
          setStats(prev => {
            const newStats = [...prev];
            newStats[0].value = classesThisWeek.toString();
            return newStats;
          });
       });
    });

    // 4. Fetch Assignments Stats
    const assignmentsRef = ref(db, `assignments/${tutorId}`);
    onValue(assignmentsRef, (snapshot) => {
       const data = snapshot.val();
       let submittedCount = 0;
       let totalGrades = 0;
       let gradedCount = 0;

       const myName = studentProfile.name.toLowerCase().trim();

       if (data) {
          Object.values(data).forEach(scheduleAssignments => {
             Object.values(scheduleAssignments).forEach(dateAssignments => {
                Object.values(dateAssignments).forEach(assignment => {
                   const isMyAssignment = assignment.selectedStudents?.some(s => s.toLowerCase().trim() === myName);
                   if (isMyAssignment) {
                      if (assignment.submissions && assignment.submissions[user.uid]) {
                         submittedCount++;
                         if (assignment.submissions[user.uid].grade) {
                            totalGrades += parseFloat(assignment.submissions[user.uid].grade);
                            gradedCount++;
                         }
                      }
                   }
                });
             });
          });
       }

        setStats(prev => {
           const newStats = [...prev];
           newStats[1].value = submittedCount.toString();
           newStats[2].value = gradedCount > 0 ? (totalGrades / gradedCount).toFixed(1) : '0.0';
           return newStats;
        });
        setLoading(false);
     });

  }, [user, studentProfile]);

  const studentInitial = studentProfile?.name?.charAt(0) || user?.displayName?.charAt(0) || 'S';

  if (loading) return (
    <div className="max-w-5xl mx-auto pt-40 pb-16 px-6 text-center">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 font-medium">Đang kết nối dữ liệu từ Gia sư...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-16 px-6 relative z-10 w-full">
      
      {/* Top Card: Student Info */}
      <div className="bg-white rounded-[32px] shadow-[0_2px_15px_rgba(0,0,0,0.04)] p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center justify-between border border-slate-100 gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[40px] font-black shrink-0 shadow-xl shadow-blue-500/20 border-4 border-white">
            {studentInitial}
          </div>
          <div className="space-y-1">
            <h2 className="text-[26px] font-black text-slate-900 leading-tight">{studentProfile?.name || 'Học sinh'}</h2>
            <p className="text-[14px] text-slate-500 font-bold flex flex-wrap items-center justify-center sm:justify-start gap-2">
               <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-[11px]">Khối {studentProfile?.grade || 'N/A'}</span>
               <span className="hidden sm:inline text-slate-300">•</span>
               <span className="w-full sm:w-auto mt-2 sm:mt-0">{studentProfile?.school || 'Chưa cập nhật trường'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 mt-6 md:mt-0 w-full md:w-auto">
          <div className="text-[14px] text-slate-600 space-y-1.5 flex flex-col items-center lg:items-start">
            <p className="flex items-center gap-2">
               <i className="fa-solid fa-user-tie text-blue-500 w-4"></i>
               <span className="font-bold text-slate-900">Gia sư:</span> {tutorProfile?.name || 'Đang cập nhật...'}
            </p>
            <p className="flex items-center gap-2">
               <i className="fa-solid fa-phone text-emerald-500 w-4"></i>
               <span className="font-bold text-slate-900">Điện thoại:</span> {tutorProfile?.phoneNumber || tutorProfile?.phone || 'N/A'}
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/student-schedule')}
            className="w-full sm:w-auto bg-gradient-to-r from-[#4ef090] to-[#3b82f6] text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-[15px] flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-calendar-days"></i>
            Xem lịch học
          </button>
        </div>
      </div>

      {/* Middle Row: 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.03)] p-6 md:p-8 border border-slate-100 hover:-translate-y-1 transition-all duration-300 group">
            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-blue-500 transition-colors uppercase">{stat.label}</h4>
            <div className="flex items-baseline gap-1">
               <p className="text-[28px] md:text-[32px] font-black text-slate-900 tracking-tight">{stat.value}</p>
               {stat.label.includes('Điểm') && <span className="text-slate-400 text-sm font-bold">/ 10</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Card: Study Materials */}
      <div className="bg-white rounded-[32px] shadow-[0_2px_30px_rgba(0,0,0,0.02)] p-6 md:p-10 border border-slate-100">
        <h3 className="text-[20px] font-black text-slate-900 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
             <i className="fa-solid fa-folder-open text-lg"></i>
          </div>
          Tài liệu học tập
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {materials.length > 0 ? materials.map((file) => (
            <div 
              key={file.id} 
              onClick={() => navigate(`/student/syllabus/${file.id}`)}
              className="flex flex-col sm:flex-row items-center sm:items-center justify-between border border-slate-100 rounded-2xl p-5 md:px-8 hover:border-blue-400 hover:bg-blue-50/20 transition-all bg-white cursor-pointer group shadow-sm hover:shadow-md gap-4"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 text-center sm:text-left">
                 <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm shrink-0">
                    <i className="fa-solid fa-file-pdf text-xl"></i>
                 </div>
                 <div className="min-w-0">
                    <span className="text-[16px] text-slate-800 font-black block group-hover:text-blue-600 transition-colors truncate">{file.name}</span>
                    <span className="text-[12px] text-slate-400 font-bold mt-0.5 block">{file.subject} • Khối {file.grade} • {file.size || 'N/A'}</span>
                 </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); window.open(file.fileUrl, '_blank'); }}
                className="w-full sm:w-auto text-blue-500 font-black text-[13px] hover:text-white px-6 py-2.5 bg-blue-50 rounded-xl hover:bg-blue-500 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i>
                Tải xuống
              </button>
            </div>
          )) : (
            <div className="py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <i className="fa-solid fa-box-open text-3xl"></i>
               </div>
               <p className="text-slate-400 font-bold text-[15px]">Chưa có tài liệu nào được Gia sư chỉ định cho lớp của bạn.</p>
               <p className="text-slate-300 text-sm mt-1">Liên hệ gia sư để thêm tài liệu mới.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default StudentAnalytics;
