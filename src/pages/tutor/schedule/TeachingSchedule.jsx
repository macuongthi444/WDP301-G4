import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import CreateScheduleModal from '../../../components/tutor/CreateScheduleModal';

const dayMap = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const dayToIndex = { 'Chủ nhật': 0, 'Thứ hai': 1, 'Thứ ba': 2, 'Thứ tư': 3, 'Thứ năm': 4, 'Thứ sáu': 5, 'Thứ bảy': 6 };
const dayKeyToName = { 'T2': 'Thứ hai', 'T3': 'Thứ ba', 'T4': 'Thứ tư', 'T5': 'Thứ năm', 'T6': 'Thứ sáu', 'T7': 'Thứ bảy', 'CN': 'Chủ nhật' };

function TeachingSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthDate, setMonthDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rawSchedules, setRawSchedules] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 1. Fetch schedules from DB
        const scheduleRef = ref(db, `schedules/${currentUser.uid}`);
        const unsubscribeSchedules = onValue(scheduleRef, (snapshot) => {
          const data = snapshot.val();
          setRawSchedules(data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : []);
        });

        // 2. Fetch attendance from DB
        const attendanceRef = ref(db, `attendance/${currentUser.uid}`);
        const unsubscribeAttendance = onValue(attendanceRef, (snapshot) => {
          const data = snapshot.val();
          setAttendanceData(data || {});
          setLoading(false);
        });

        return () => {
          unsubscribeSchedules();
          unsubscribeAttendance();
        };
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // Color map
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



  const getISODateForDay = (dayName) => {
    // Treat Sunday as day 7 instead of 0 for correct week bounds
    const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const targetDayIndex = dayToIndex[dayName] === 0 ? 7 : dayToIndex[dayName];
    
    const diff = targetDayIndex - currentDay;
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + diff);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Format schedules into the day-of-week structure
  const scheduleData = useMemo(() => {
    const data = {
      'Thứ hai': [], 'Thứ ba': [], 'Thứ tư': [], 'Thứ năm': [], 'Thứ sáu': [], 'Thứ bảy': [], 'Chủ nhật': []
    };
    const now = new Date();

    rawSchedules.forEach(item => {
      const processItem = (dayName) => {
        const isoDate = getISODateForDay(dayName);
        const scheduleId = item.id;

        // Attendance logic — support both old and new per-student format
        const sessionAttendance = attendanceData[scheduleId]?.[isoDate];
        let status = 'none';
        let detail = 'Chưa bắt đầu';

        // Check auto-absent (past midnight of the same day)
        const sessionMidnight = new Date(isoDate);
        sessionMidnight.setHours(23, 59, 59, 999);

        if (sessionAttendance) {
          if (sessionAttendance.students) {
            // New per-student format
            const studentStatuses = Object.values(sessionAttendance.students).map(s => s.status);
            const allPresent = studentStatuses.length > 0 && studentStatuses.every(s => s === 'present');
            const anyMarked = studentStatuses.some(s => s && s !== '');
            if (allPresent) {
              status = 'present';
              detail = 'Thành công';
            } else if (anyMarked) {
              status = 'partial';
              detail = 'Đã điểm danh';
            } else if (now > sessionMidnight) {
              status = 'partial';
              detail = 'Vắng (Auto)';
            }
          } else if (sessionAttendance.status) {
            // Legacy single format
            status = sessionAttendance.status === 'present' ? 'present' : 'partial';
            detail = sessionAttendance.status === 'present' ? 'Thành công' : 'Vắng';
          }
        } else if (now > sessionMidnight) {
          status = 'partial';
          detail = 'Vắng (Auto)';
        }

        if (data[dayName]) {
          data[dayName].push({
            time: item.startTime,
            subject: item.subject || item.className,
            students: [item.className],
            location: item.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp',
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
      } else {
        if (item.startDate) {
          const date = new Date(item.startDate);
          const dayName = dayMap[date.getDay()];
          processItem(dayName);
        }
      }
    });

    Object.keys(data).forEach(day => {
      data[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    return data;
  }, [rawSchedules, attendanceData, selectedDate]);

  const days = Object.keys(scheduleData);




  const getDateForDay = (dayName) => {
    const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const targetDayIndex = dayToIndex[dayName] === 0 ? 7 : dayToIndex[dayName];
    
    const diff = targetDayIndex - currentDay;
    const targetDate = new Date(selectedDate);
    targetDate.setDate(selectedDate.getDate() + diff);
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Get classes for a specific date considering endDate and exceptions
  const getClassesForSpecificDate = useCallback((targetDate) => {
    const dayIdx = targetDate.getDay();
    const dayName = dayMap[dayIdx];
    const dayKey = Object.keys(dayKeyToName).find(k => dayKeyToName[k] === dayName);
    const isoDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    const classesForDate = [];
    rawSchedules.forEach(item => {
      let isScheduled = false;
      if (item.scheduleType === 'weekly') {
        if (item.selectedDays?.includes(dayKey)) {
          const isException = item.exceptions && item.exceptions[isoDate];
          if (!isException && (!item.startDate || isoDate >= item.startDate) && (!item.endDate || isoDate <= item.endDate)) isScheduled = true;
        }
      } else {
        if (item.startDate === isoDate) isScheduled = true;
      }
      if (isScheduled) {
        classesForDate.push(item);
      }
    });
    return classesForDate;
  }, [rawSchedules]);

  const handleDayClick = (dayName) => {
    setSelectedDay(dayName);
    setActiveView('day');
  };

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async (option) => {
    if (!deleteTarget || !user) return;

    try {
      if (deleteTarget.scheduleType === 'single') {
        const isoToday = new Date().toISOString().split('T')[0];
        if (deleteTarget.startDate < isoToday) {
           alert('Buổi học này đã qua nên không thể xóa để đảm bảo dữ liệu lịch sử!');
           setShowDeleteConfirm(false);
           setDeleteTarget(null);
           return;
        }
        // Delete all recurrences for single
        await remove(ref(db, `schedules/${user.uid}/${deleteTarget.id}`));
      } else if (option === 'all') {
        // Delete all for weekly
        const scheduleAttendance = attendanceData[deleteTarget.id] || {};
        const attendedDates = Object.keys(scheduleAttendance);
        
        if (attendedDates.length > 0) {
           const maxAttendedDate = attendedDates.sort().pop();
           await update(ref(db, `schedules/${user.uid}/${deleteTarget.id}`), {
             endDate: maxAttendedDate
           });
           alert(`Lịch dạy này đã có dữ liệu điểm danh nên hệ thống sẽ tự động kết thúc lịch sau ngày ${maxAttendedDate.split('-').reverse().join('/')} thay vì xoá hoàn toàn dữ liệu cũ.`);
        } else {
           await remove(ref(db, `schedules/${user.uid}/${deleteTarget.id}`));
        }
      } else {
        // Delete only today (exception)
        const isoDate = getISODateForDay(selectedDay);
        const isoToday = new Date().toISOString().split('T')[0];

        // prevent deleting if in the past
        if (isoDate < isoToday) {
           alert('Buổi học này đã diễn ra trong quá khứ, không thể xóa để đảm bảo dữ liệu lịch sử!');
           setShowDeleteConfirm(false);
           setDeleteTarget(null);
           return;
        }

        // prevent deleting if already attended
        if (attendanceData[deleteTarget.id]?.[isoDate]) {
           alert('Buổi học này đã được điểm danh, không thể xoá!');
           setShowDeleteConfirm(false);
           setDeleteTarget(null);
           return;
        }
        await update(ref(db, `schedules/${user.uid}/${deleteTarget.id}/exceptions`), {
          [isoDate]: true
        });
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      alert('Xóa thất bại: ' + error.message);
    }
  };

  const handleViewChange = (view) => {
    if (view === 'day') {
      // Auto-select today
      const todayName = dayMap[new Date().getDay()];
      setSelectedDay(todayName);
      setSelectedDate(new Date());
    } else if (view === 'week') {
      setSelectedDay(null);
      setSelectedDate(new Date()); // Reset to current week
    } else {
      setSelectedDay(null);
    }
    setActiveView(view);
  };

  const handleMonthDateClick = (date) => {
    const dayName = dayMap[date.getDay()];
    setSelectedDate(date);
    setSelectedDay(dayName);
    setActiveView('day');
  };

  // Month view helpers
  const getMonthData = () => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Mon=1,...Sun=7
    const daysInMonth = lastDay.getDate();

    const weeks = [];
    let currentWeek = new Array(startDayOfWeek - 1).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  };

  const monthStats = useMemo(() => {
    if (!rawSchedules.length) return { taught: 0, pending: 0, absent: 0 };

    let taught = 0;
    let pending = 0;
    let absent = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const dayIdx = currentDate.getDay();
      const dayName = dayMap[dayIdx];
      const dayKey = Object.keys(dayKeyToName).find(k => dayKeyToName[k] === dayName);
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      rawSchedules.forEach(item => {
        let isScheduled = false;
        if (item.scheduleType === 'weekly') {
          if (item.selectedDays?.includes(dayKey)) {
            const isException = item.exceptions && item.exceptions[isoDate];
            if (!isException && (!item.startDate || isoDate >= item.startDate) && (!item.endDate || isoDate <= item.endDate)) isScheduled = true;
          }
        } else {
          if (item.startDate === isoDate) isScheduled = true;
        }

        if (isScheduled) {
          const sessionAttendance = attendanceData[item.id]?.[isoDate];
          if (sessionAttendance) {
            if (sessionAttendance.students) {
              // New per-student format
              const statuses = Object.values(sessionAttendance.students).map(s => s.status);
              const anyPresent = statuses.some(s => s === 'present');
              const anyMarked = statuses.some(s => s && s !== '');
              if (anyPresent) taught++;
              else if (anyMarked) absent++;
              else if (currentDate < now) absent++;
              else pending++;
            } else if (sessionAttendance.status) {
              // Legacy single format
              if (sessionAttendance.status === 'present') taught++;
              else absent++;
            }
          } else {
            if (currentDate < now) absent++;
            else pending++;
          }
        }
      });
    }

    return { taught, pending, absent };
  }, [rawSchedules, attendanceData, monthDate]);

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  const dayViewData = selectedDay ? scheduleData[selectedDay] || [] : [];

  return (
    <>
      <TutorNavbar activePage="teaching-schedule" />

      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Page Title Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10 gap-6">
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 flex flex-wrap items-center gap-2.5">
                📅 Lịch dạy {activeView === 'day' && selectedDay && (
                  <span className="font-normal text-slate-500">Ngày {getDateForDay(selectedDay)}</span>
                )}
              </h1>
              <p className="text-[14px] text-slate-400 mt-1">
                {activeView === 'day' ? 'Quản lý buổi dạy của bạn và điểm danh' : 'Quản lý buổi dạy của bạn và xếp thời gian'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-5 w-full md:w-auto">
              <div className="flex bg-slate-100 rounded-2xl p-1 h-[52px]">
                {[{ label: 'Ngày', value: 'day' }, { label: 'Tuần', value: 'week' }, { label: 'Tháng', value: 'month' }].map((v) => (
                  <button
                    key={v.value}
                    onClick={() => handleViewChange(v.value)}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center ${activeView === v.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px] flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Tạo lịch</span>
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 mb-0"></div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm font-medium">Đang tải lịch dạy...</p>
            </div>
          )}

          {/* ===== DAY VIEW ===== */}
          {!loading && activeView === 'day' && selectedDay && (
            <div className="mt-6 space-y-3">
              <button onClick={() => handleViewChange('week')} className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1.5 mb-4">
                <i className="fa-solid fa-arrow-left text-xs"></i> Quay lại tuần
              </button>

              {dayViewData.length > 0 ? (
                dayViewData.map((item, i) => (
                  <div key={i} onClick={() => navigate(`/session-detail/${item.id}/${getISODateForDay(selectedDay)}`)} className="bg-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:bg-slate-700 transition-all cursor-pointer shadow-lg shadow-slate-200/20 active:scale-[0.99]">
                    <div className="flex-1">
                      <p className="text-white font-bold text-[15px]">
                        {item.time} - {item.subject} - {item.students.join(', ')}
                      </p>
                      <p className={`text-[13px] font-semibold mt-1 ${item.attendance === 'present' ? 'text-emerald-400' :
                          item.attendance === 'partial' ? 'text-white' :
                            'text-slate-400'
                        }`}>
                        {item.attendance === 'partial' && (
                          <><span className="text-red-400 font-bold">Vắng</span>{' '}{item.attendanceDetail.replace('Vắng ', '')}</>
                        )}
                        {item.attendance === 'present' && item.attendanceDetail}
                        {item.attendance === 'none' && item.attendanceDetail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.attendance === 'none' && getISODateForDay(selectedDay) >= new Date().toISOString().split('T')[0] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                        >
                          <i className="fa-regular fa-trash-can text-lg"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <i className="fa-regular fa-calendar-xmark text-4xl text-slate-200 mb-4 block"></i>
                  <p className="text-slate-400 font-medium">Không có buổi dạy nào vào {selectedDay}</p>
                </div>
              )}
            </div>
          )}

          {/* ===== WEEK VIEW ===== */}
          {!loading && activeView === 'week' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[800px]">
                {['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'].map((day, idx) => {
                  const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
                  const targetDayIndex = dayToIndex[day] === 0 ? 7 : dayToIndex[day];
                  const diff = targetDayIndex - currentDay;
                  
                  const targetD = new Date(selectedDate);
                  targetD.setDate(selectedDate.getDate() + diff);
                  const isToday = targetD.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={day} className={`flex flex-col min-h-[420px] ${idx < 6 ? 'border-r border-slate-200' : ''}`}>
                      <div
                        onClick={() => {
                          setSelectedDate(targetD);
                          handleDayClick(day);
                        }}
                        className={`py-3 px-2 text-center border-b border-slate-200 cursor-pointer transition-colors ${isToday ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-white' : 'text-slate-500'}`}>{day}</p>
                      </div>
                      <div className="flex-1 p-1.5 space-y-1.5 cursor-pointer relative group" onClick={() => {
                        setSelectedDate(targetD);
                        handleDayClick(day);
                      }}>
                        {scheduleData[day].length > 0 ? (
                          scheduleData[day].map((item, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/session-detail/${item.id}/${getISODateForDay(day)}`);
                              }}
                              className={`bg-white border border-slate-100 ${subjectColors[item.subject] || 'border-l-slate-300'} border-l-[3px] rounded-lg p-2 hover:shadow-md hover:-translate-y-px transition-all relative group`}
                            >
                              <p className="text-[10px] font-semibold text-slate-400 leading-none">{item.time}</p>
                              <p className="text-[12px] font-bold text-slate-800 mt-1 leading-tight">{item.subject}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.students.join(', ')}</p>
                              {item.attendance !== 'none' && (
                                <div className="mt-1.5 flex items-center gap-1.5 py-0.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.attendance === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-[9px] font-bold uppercase tracking-tight ${item.attendance === 'present' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {item.attendance === 'present' ? 'Đã điểm danh' : 'Vắng'}
                                  </span>
                                </div>
                              )}

                              {/* Removed quick-delete button from Week View */}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[11px] text-slate-300 italic">Không có buổi dạy</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== MONTH VIEW ===== */}
          {!loading && activeView === 'month' && (
            <div className="mt-6 flex flex-col lg:flex-row gap-8 items-start">
              {/* Calendar Grid */}
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                    <div key={d} className="py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {getMonthData().map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                    {week.map((day, di) => {
                      if (day === null) {
                        return <div key={di} className="py-4 px-2 min-h-[72px]"></div>;
                      }
                      const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                      const cellDayName = dayMap[cellDate.getDay()];
                      const classes = getClassesForSpecificDate(cellDate);
                      const isCurrentToday = cellDate.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={di}
                          onClick={() => {
                            setSelectedDate(cellDate);
                            setSelectedDay(cellDayName);
                            setActiveView('day');
                          }}
                          className={`py-3 px-2.5 min-h-[72px] cursor-pointer transition-colors hover:bg-slate-50 ${di < 6 ? 'border-r border-slate-100' : ''} ${isCurrentToday ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`text-[14px] font-bold ${isCurrentToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
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

              {/* Right panel: Month nav + decoration */}
              <div className="w-full lg:w-[280px] shrink-0 flex flex-col items-center gap-6">
                {/* Month navigator */}
                <div className="bg-slate-800 rounded-full py-3 px-5 flex items-center gap-4 w-full justify-between">
                  <button
                    onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
                    className="text-white hover:text-blue-300 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <span className="text-white font-bold text-[14px]">
                    {monthNames[monthDate.getMonth()]}, {monthDate.getFullYear()}
                  </span>
                  <button
                    onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
                    className="text-white hover:text-blue-300 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

                {/* Decoration */}
                <div className="text-center">
                  <div className="text-6xl mb-3">🎓</div>
                  <p className="text-slate-400 text-xs font-medium">Bấm vào ngày để xem chi tiết buổi dạy</p>
                </div>

                {/* Month Stats */}
                <div className="w-full bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100/50 shadow-md">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Thống kê tháng này</p>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <i className="fa-solid fa-check text-xs"></i>
                      </div>
                      <span className="text-[13px] text-slate-600 font-bold group-hover:text-emerald-600 transition-colors">Đã dạy</span>
                    </div>
                    <span className="text-[16px] font-black text-slate-800">{monthStats.taught}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <i className="fa-regular fa-clock text-xs"></i>
                      </div>
                      <span className="text-[13px] text-slate-600 font-bold group-hover:text-blue-600 transition-colors">Chưa dạy</span>
                    </div>
                    <span className="text-[16px] font-black text-slate-800">{monthStats.pending}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </div>
                      <span className="text-[13px] text-slate-600 font-bold group-hover:text-red-600 transition-colors">Vắng</span>
                    </div>
                    <span className="text-[16px] font-black text-slate-800">{monthStats.absent}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />

      <CreateScheduleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={user?.uid}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa buổi dạy <b>{deleteTarget?.subject}</b> này không?
            </p>

            <div className="space-y-2">
              {deleteTarget?.scheduleType === 'weekly' && (
                <button
                  onClick={() => confirmDelete('single')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Chỉ xóa ngày hôm nay
                </button>
              )}
              <button
                onClick={() => confirmDelete('all')}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-sm"
              >
                {deleteTarget?.scheduleType === 'weekly' ? 'Xóa tất cả các buổi' : 'Đồng ý xóa'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-white text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
              >
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TeachingSchedule;
