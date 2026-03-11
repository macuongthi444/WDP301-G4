import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';

const dayMap = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const dayToIndex = { 'Chủ nhật': 0, 'Thứ hai': 1, 'Thứ ba': 2, 'Thứ tư': 3, 'Thứ năm': 4, 'Thứ sáu': 5, 'Thứ bảy': 6 };
const dayKeyToName = { 'T2': 'Thứ hai', 'T3': 'Thứ ba', 'T4': 'Thứ tư', 'T5': 'Thứ năm', 'T6': 'Thứ sáu', 'T7': 'Thứ bảy', 'CN': 'Chủ nhật' };

function StudentSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [enrolledClassNames, setEnrolledClassNames] = useState([]);
  const [activeView, setActiveView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthDate, setMonthDate] = useState(new Date());
  const [rawSchedules, setRawSchedules] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  // Color map (matching Tutor side)
  const subjectColors = {
    'Toán': 'border-l-blue-400',
    'Lý': 'border-l-violet-400',
    'Hoá': 'border-l-orange-400',
    'Tiếng Anh': 'border-l-pink-400',
    'Văn': 'border-l-emerald-400',
  };

  const subjectBadgeColors = {
    'Toán': 'bg-blue-500',
    'Lý': 'bg-violet-500',
    'Hoá': 'bg-orange-500',
    'Tiếng Anh': 'bg-pink-500',
    'Văn': 'bg-emerald-500',
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = ref(db, `users/${currentUser.uid}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
           const userData = userSnap.val();
           const { tutorId, studentId } = userData;
           if (tutorId && studentId) {
              onValue(ref(db, `students/${tutorId}/${studentId}`), (snap) => {
                const sData = snap.val();
                if (sData) setStudentProfile({ ...sData, tutorId, studentId });
              });
              onValue(ref(db, `users/${tutorId}`), (snap) => {
                if (snap.exists()) setTutorProfile(snap.val());
              });
              
              // New: Fetch classes to find enrolled ones
              onValue(ref(db, `classes/${tutorId}`), (snap) => {
                const classesData = snap.val() || {};
                const enrolled = [];
                Object.values(classesData).forEach(c => {
                  if (c.selectedStudents?.includes(studentProfile?.name || userData.name)) {
                    enrolled.push(c.name);
                  }
                });
                setEnrolledClassNames(enrolled);
              });

              onValue(ref(db, `schedules/${tutorId}`), (snap) => {
                const data = snap.val();
                setRawSchedules(data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : []);
              });
              onValue(ref(db, `attendance/${tutorId}`), (snap) => {
                setAttendanceData(snap.val() || {});
                setLoading(false);
              });
           } else { setLoading(false); }
        } else { setLoading(false); }
      } else { navigate('/login'); }
    });
    return unsubAuth;
  }, [navigate]);

  const getISODateForDay = useCallback((dayName) => {
    const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const targetDayIndex = dayToIndex[dayName] === 0 ? 7 : dayToIndex[dayName];
    const diff = targetDayIndex - currentDay;
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + diff);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const scheduleData = useMemo(() => {
    const data = { 'Thứ hai': [], 'Thứ ba': [], 'Thứ tư': [], 'Thứ năm': [], 'Thứ sáu': [], 'Thứ bảy': [], 'Chủ nhật': [] };
    const now = new Date();

    rawSchedules.forEach(item => {
      // Improved matching: Student Name OR Student ID OR Class Name
      const isMySchedule = item.selectedStudents?.includes(studentProfile?.name) || 
                           item.studentId === user?.uid ||
                           enrolledClassNames.includes(item.className);

      if (!isMySchedule) return;

      const processItem = (dayName) => {
        const isoDate = getISODateForDay(dayName);
        const sessionAttendance = attendanceData[item.id]?.[isoDate];
        let status = 'none';
        let detail = 'Chưa học';
        const sessionDateMidnight = new Date(isoDate); sessionDateMidnight.setHours(23, 59, 59, 999);

        if (sessionAttendance) {
          const myAtt = sessionAttendance.students?.[studentProfile?.name];
          if (myAtt) {
             status = myAtt.status === 'present' ? 'present' : 'partial';
             detail = myAtt.status === 'present' ? 'Thành công' : 'Vắng';
          } else if (sessionAttendance.status) {
             status = sessionAttendance.status === 'present' ? 'present' : 'partial';
             detail = sessionAttendance.status === 'present' ? 'Thành công' : 'Vắng';
          }
        } else if (now > sessionDateMidnight) {
          status = 'partial'; detail = 'Vắng (Auto)';
        }

        if (data[dayName]) {
          data[dayName].push({
            time: item.startTime,
            subject: item.subject || item.className,
            attendance: status,
            attendanceDetail: detail,
            ...item
          });
        }
      };

      if (item.scheduleType === 'weekly') {
        item.selectedDays?.forEach(dayKey => {
          const dayName = dayKeyToName[dayKey];
          const isoDate = getISODateForDay(dayName);
          const isException = item.exceptions && item.exceptions[isoDate];
          if (!isException && (!item.startDate || isoDate >= item.startDate) && (!item.endDate || isoDate <= item.endDate)) processItem(dayName);
        });
      } else if (item.startDate) {
        const date = new Date(item.startDate);
        processItem(dayMap[date.getDay()]);
      }
    });

    Object.keys(data).forEach(day => data[day].sort((a, b) => a.time.localeCompare(b.time)));
    return data;
  }, [rawSchedules, attendanceData, getISODateForDay, studentProfile, user, enrolledClassNames]);

  const monthStats = useMemo(() => {
    if (!rawSchedules.length) return { taught: 0, pending: 0, absent: 0 };
    let taught = 0; let pending = 0; let absent = 0;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const year = monthDate.getFullYear(); const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayName = dayMap[currentDate.getDay()];
      const dayKey = Object.keys(dayKeyToName).find(k => dayKeyToName[k] === dayName);

      rawSchedules.forEach(item => {
        const isMySchedule = item.selectedStudents?.includes(studentProfile?.name) || 
                             item.studentId === user?.uid ||
                             enrolledClassNames.includes(item.className);
        if (!isMySchedule) return;

        let isScheduled = false;
        if (item.scheduleType === 'weekly') {
          if (item.selectedDays?.includes(dayKey)) {
             const isException = item.exceptions && item.exceptions[isoDate];
             if (!isException && (!item.startDate || isoDate >= item.startDate) && (!item.endDate || isoDate <= item.endDate)) isScheduled = true;
          }
        } else if (item.startDate === isoDate) isScheduled = true;

        if (isScheduled) {
          const sessionAttendance = attendanceData[item.id]?.[isoDate];
          if (sessionAttendance) {
             const myAtt = sessionAttendance.students?.[studentProfile?.name];
             if (myAtt?.status === 'present' || (!sessionAttendance.students && sessionAttendance.status === 'present')) taught++;
             else absent++;
          } else {
             const sessionDateMidnight = new Date(isoDate); sessionDateMidnight.setHours(23, 59, 59, 999);
             if (now > sessionDateMidnight) absent++; else pending++;
          }
        }
      });
    }
    return { taught, pending, absent };
  }, [rawSchedules, attendanceData, monthDate, studentProfile, user, enrolledClassNames]);

  const getDateForDay = (dayName) => {
    const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const targetD = new Date(selectedDate);
    targetD.setDate(selectedDate.getDate() + (dayToIndex[dayName] === 0 ? 7 : dayToIndex[dayName]) - currentDay);
    return `${String(targetD.getDate()).padStart(2, '0')}/${String(targetD.getMonth() + 1).padStart(2, '0')}/${targetD.getFullYear()}`;
  };

  const getClassesForSpecificDate = useCallback((targetDate) => {
    const isoDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    const dayName = dayMap[targetDate.getDay()];
    const dayKey = Object.keys(dayKeyToName).find(k => dayKeyToName[k] === dayName);
    return rawSchedules.filter(item => {
      const isMySchedule = item.selectedStudents?.includes(studentProfile?.name) || 
                           item.studentId === user?.uid ||
                           enrolledClassNames.includes(item.className);
      if (!isMySchedule) return false;
      if (item.scheduleType === 'weekly') {
         const isException = item.exceptions && item.exceptions[isoDate];
         return item.selectedDays?.includes(dayKey) && !isException && (!item.startDate || isoDate >= item.startDate) && (!item.endDate || isoDate <= item.endDate);
      }
      return item.startDate === isoDate;
    });
  }, [rawSchedules, studentProfile, user, enrolledClassNames]);

  const getMonthData = () => {
    const year = monthDate.getFullYear(); const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const weeks = []; let currentWeek = new Array(startDayOfWeek - 1).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }
    return weeks;
  };

  const handleViewChange = (view) => {
    if (view === 'day') { setSelectedDay(dayMap[new Date().getDay()]); setSelectedDate(new Date()); }
    else if (view === 'week') { setSelectedDay(null); setSelectedDate(new Date()); }
    else { setSelectedDay(null); }
    setActiveView(view);
  };

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  if (loading) return (
     <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc]">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="bg-[#f8f9fc] min-h-screen text-slate-900 font-sans">
      <StudentNavbar activePage="dashboard" />
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
           <div>
              <h1 className="text-[26px] font-bold text-slate-900 flex items-center flex-wrap gap-2.5">
                 📅 Lịch học {activeView === 'day' && selectedDay && (
                   <span className="font-normal text-slate-500 text-[18px] sm:text-[20px]">Ngày {getDateForDay(selectedDay)}</span>
                 )}
              </h1>
              <p className="text-[14px] text-slate-400 mt-1">
                 {activeView === 'day' ? 'Chi tiết các buổi học trong ngày' : 'Quản lý thời gian học tập trực quan'}
              </p>
           </div>
           
           <div className="flex bg-slate-100 rounded-2xl p-1 h-[52px] w-full lg:w-auto overflow-x-auto no-scrollbar">
              {[{ label: 'Ngày', value: 'day' }, { label: 'Tuần', value: 'week' }, { label: 'Tháng', value: 'month' }].map((v) => (
                 <button
                    key={v.value}
                    onClick={() => handleViewChange(v.value)}
                    className={`flex-1 lg:flex-none min-w-[80px] px-6 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center ${activeView === v.value
                        ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    {v.label}
                 </button>
              ))}
           </div>
        </div>

        {/* ===== DAY VIEW ===== */}
        {activeView === 'day' && selectedDay && (
           <div className="mt-6 space-y-3">
              <button onClick={() => handleViewChange('week')} className="text-sm text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1.5 mb-6">
                <i className="fa-solid fa-arrow-left text-xs"></i> Quay lại tuần
              </button>
              {scheduleData[selectedDay].length > 0 ? (
                scheduleData[selectedDay].map((item, i) => (
                  <div key={i} 
                    onClick={() => navigate(`/student/session-detail/${item.id}/${getDateForDay(selectedDay).split('/').reverse().join('-')}`)}
                    className="bg-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:bg-slate-700 transition-all cursor-pointer shadow-lg shadow-slate-200/20 active:scale-[0.99]">
                    <div className="flex-1">
                      <p className="text-white font-bold text-[15px] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span>{item.time} - {item.subject}</span>
                        <span className="hidden sm:inline text-slate-500 font-normal">•</span>
                        <span className="text-slate-400 text-sm font-medium">Gia sư {tutorProfile?.name}</span>
                      </p>
                      <p className={`text-[13px] font-semibold mt-1 ${item.attendance === 'present' ? 'text-emerald-400' : item.attendance === 'partial' ? 'text-white' : 'text-slate-400'}`}>
                        {item.attendance === 'partial' && <><span className="text-red-400 font-bold">Vắng</span>{' '}{item.attendanceDetail.replace('Vắng ', '')}</>}
                        {item.attendance === 'present' && item.attendanceDetail}
                        {item.attendance === 'none' && item.attendanceDetail}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100"><i className="fa-regular fa-calendar-xmark text-4xl text-slate-200 mb-4 block"></i><p className="text-slate-400 font-medium font-bold">Không có buổi học nào vào {selectedDay}</p></div>
              )}
           </div>
        )}

        {/* ===== WEEK VIEW ===== */}
        {activeView === 'week' && (
           <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[1000px]">
                 {dayMap.slice(1).concat(dayMap[0]).map((day, idx) => {
                    const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
                    const targetD = new Date(selectedDate);
                    targetD.setDate(selectedDate.getDate() + (dayToIndex[day] === 0 ? 7 : dayToIndex[day]) - currentDay);
                    const isToday = targetD.toDateString() === new Date().toDateString();
                    return (
                       <div key={day} className={`flex flex-col min-h-[420px] ${idx < 6 ? 'border-r border-slate-200' : ''}`}>
                          <div onClick={() => { setSelectedDate(targetD); setSelectedDay(day); setActiveView('day'); }}
                             className={`py-3 px-2 text-center border-b border-slate-200 cursor-pointer transition-colors ${isToday ? 'bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                             <p className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-white' : 'text-slate-500'}`}>{day}</p>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5 bg-white">
                             {scheduleData[day].length > 0 ? (
                                scheduleData[day].map((item, i) => (
                                   <div key={i} 
                                   onClick={() => navigate(`/student/session-detail/${item.id}/${getISODateForDay(day)}`)}
                                   className={`bg-white border border-slate-100 ${subjectColors[item.subject] || 'border-l-slate-300'} border-l-[3px] rounded-lg p-2 hover:shadow-md transition-all cursor-pointer`}>
                                      <p className="text-[10px] font-semibold text-slate-400 leading-none">{item.time}</p>
                                      <p className="text-[12px] font-bold text-slate-800 mt-1 leading-tight">{item.subject}</p>
                                      {item.attendance !== 'none' && (
                                         <div className="mt-1.5 flex items-center gap-1.5 py-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.attendance === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            <span className={`text-[9px] font-bold uppercase tracking-tight ${item.attendance === 'present' ? 'text-emerald-600' : 'text-red-500'}`}>
                                               {item.attendance === 'present' ? 'Đã điểm danh' : 'Vắng'}
                                            </span>
                                         </div>
                                      )}
                                   </div>
                                ))
                             ) : (
                                <div className="flex items-center justify-center h-full opacity-30"><p className="text-[11px] text-slate-300 italic uppercase [writing-mode:vertical-lr] rotate-180">Không có buổi học</p></div>
                             )}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

        {/* ===== MONTH VIEW ===== */}
        {activeView === 'month' && (
           <div className="mt-6 flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white w-full">
                 <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                       <div key={d} className="py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                    ))}
                 </div>
                 {getMonthData().map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                       {week.map((day, di) => {
                          if (day === null) return <div key={di} className="py-4 px-2 min-h-[72px]"></div>;
                          const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                          const classes = getClassesForSpecificDate(cellDate);
                          const isToday = cellDate.toDateString() === new Date().toDateString();
                          return (
                             <div key={di} onClick={() => { setSelectedDate(cellDate); setSelectedDay(dayMap[cellDate.getDay()]); setActiveView('day'); }}
                                className={`py-3 px-2.5 min-h-[72px] cursor-pointer transition-colors hover:bg-slate-50 ${di < 6 ? 'border-r border-slate-100' : ''} ${isToday ? 'bg-blue-50/50' : ''}`}
                             >
                                <div className="flex items-start justify-between">
                                   <span className={`text-[14px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
                                   {classes.length > 0 && (
                                      <div className="flex gap-0.5 flex-wrap justify-end">
                                         {classes.map((c, ci) => (
                                            <span key={ci} className={`w-[18px] h-[18px] rounded-full ${subjectBadgeColors[c.subject] || 'bg-slate-400'} text-white text-[9px] font-bold flex items-center justify-center`}>
                                               {classes.length > 1 ? ci + 1 : classes.length}
                                            </span>
                                         ))}
                                      </div>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 ))}
              </div>

              <div className="w-full lg:w-[280px] shrink-0 flex flex-col items-center gap-6">
                 {/* Month Nav */}
                 <div className="bg-slate-800 rounded-full py-3 px-5 flex items-center gap-4 w-full justify-between shadow-lg">
                    <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))} className="text-white hover:text-blue-300 transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
                    <span className="text-white font-bold text-[14px]">{monthNames[monthDate.getMonth()]}, {monthDate.getFullYear()}</span>
                    <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))} className="text-white hover:text-blue-300 transition-colors"><i className="fa-solid fa-arrow-right"></i></button>
                 </div>
                 {/* Annotation */}
                 <div className="text-center font-bold font-medium"><div className="text-5xl mb-3">👨‍🎓</div><p className="text-slate-400 text-xs">Bấm vào ngày để xem chi tiết buổi học</p></div>
                 {/* Stats Card */}
                 <div className="w-full bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100/50 shadow-md">
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Thống kê tháng này</p>
                    <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></div><span className="text-[13px] text-slate-600 font-bold">Đã học</span></div>
                       <span className="text-[16px] font-black text-slate-800">{monthStats.taught}</span>
                    </div>
                    <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fa-regular fa-clock text-xs"></i></div><span className="text-[13px] text-slate-600 font-bold">Chưa học</span></div>
                       <span className="text-[16px] font-black text-slate-800">{monthStats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><i className="fa-solid fa-xmark text-xs"></i></div><span className="text-[13px] text-slate-600 font-bold">Vắng</span></div>
                       <span className="text-[16px] font-black text-slate-800">{monthStats.absent}</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

export default StudentSchedule;
