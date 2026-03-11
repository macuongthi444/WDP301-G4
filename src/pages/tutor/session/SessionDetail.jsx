import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import AssignHomeworkModal from '../../../components/tutor/AssignHomeworkModal';

function SessionDetail() {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // Per-student attendance: { "StudentName": { status, note, eval_* } }
  const [studentsAttendance, setStudentsAttendance] = useState({});
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [classesData, setClassesData] = useState({});
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultStudentData = () => ({
    status: '',
    note: '',
    eval_consciousness: 0,
    eval_progress: 0,
    eval_thinking: 0
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [id, date]);

  const fetchData = (uid) => {
    const scheduleRef = ref(db, `schedules/${uid}/${id}`);
    onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSession(data);
    });

    const attendanceRef = ref(db, `attendance/${uid}/${id}/${date}`);
    onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.students) {
          // New format: per-student
          setStudentsAttendance(data.students);
        } else if (data.status) {
          // Old format: single attendance - migrate to per-student
          // Will be converted when studentsList is available
          setStudentsAttendance({ __legacy__: data });
        }
      }
    });

    const assignmentsRef = ref(db, `assignments/${uid}/${id}/${date}`);
    onValue(assignmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([aid, val]) => ({ id: aid, ...val }));
        setAssignments(list);
        setAssignmentCount(list.length);
      } else {
        setAssignments([]);
        setAssignmentCount(0);
      }
    });

    const classesRef = ref(db, `classes/${uid}`);
    onValue(classesRef, (snapshot) => {
      setClassesData(snapshot.val() || {});
    });

    const studentsRef = ref(db, `students/${uid}`);
    onValue(studentsRef, (snapshot) => {
      setStudentsListDetailed(snapshot.val() || {});
      setLoading(false);
    });
  };

  const [studentsListDetailed, setStudentsListDetailed] = useState({});

  // Resolve student list and initialize attendance
  useEffect(() => {
    if (session && classesData) {
      const classObj = Object.values(classesData).find(c => c.name === session.className);
      const students = classObj?.selectedStudents || [];
      setStudentsList(students);

      // Initialize attendance for students not yet in the map
      setStudentsAttendance(prev => {
        const updated = { ...prev };
        // Handle legacy migration
        if (updated.__legacy__) {
          const legacyData = updated.__legacy__;
          delete updated.__legacy__;
          students.forEach(name => {
            if (!updated[name]) {
              updated[name] = { ...legacyData };
            }
          });
        } else {
          students.forEach(name => {
            if (!updated[name]) {
              updated[name] = defaultStudentData();
            }
          });
        }
        return updated;
      });
    }
  }, [session, classesData]);

  const updateStudentField = (studentName, field, value) => {
    setStudentsAttendance(prev => ({
      ...prev,
      [studentName]: { ...prev[studentName], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation: Check if all students have a status
    const missingStatus = studentsList.filter(name => !studentsAttendance[name]?.status);
    if (missingStatus.length > 0) {
      alert(`Vui lòng chọn trạng thái (Có mặt/Vắng) cho: ${missingStatus.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const attendanceRef = ref(db, `attendance/${user.uid}/${id}/${date}`);
      await set(attendanceRef, {
        students: studentsAttendance,
        updatedAt: new Date().toISOString()
      });

      // Gửi thông báo cho Phụ huynh về việc điểm danh
      for (const studentName of studentsList) {
        const studentProfile = Object.values(studentsListDetailed).find(s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim());
        if (studentProfile?.studentAuthId) {
          const att = studentsAttendance[studentName];
          const statusText = att.status === 'present' ? 'CÓ MẶT' : att.status === 'absent' ? 'VẮNG MẶT' : 'CHƯA RÕ';
          
          await fetch('https://asia-southeast1-tutor-note-6e8b1.cloudfunctions.net/sendNotification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: studentProfile.studentAuthId,
              title: `📍 Điểm danh lớp ${session.className}`,
              body: `Học sinh ${studentName} được xác nhận: ${statusText} buổi học ngày ${displayDate}.`,
              targetRole: 'parent' // Chỉ gửi cho Phụ huynh
            })
          });
        }
      }

      alert('Đã lưu thông tin buổi học và gửi thông báo cho Phụ huynh!');
    } catch (error) {
      alert('Lưu thất bại: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !session) return;
    const isWeekly = session.scheduleType === 'weekly';
    let message = 'Bạn có chắc chắn muốn xoá buổi học này?';
    if (isWeekly) {
      message = 'Bạn có chắc chắn muốn xoá BUỔI HỌC NÀY? (Chỉ xoá buổi của ngày ' + displayDate + ')';
    }
    if (!window.confirm(message)) return;

    setSaving(true);
    try {
      if (isWeekly) {
        const deletedDates = session.deletedDates || [];
        if (!deletedDates.includes(date)) deletedDates.push(date);
        await update(ref(db, `schedules/${user.uid}/${id}`), { deletedDates });
      } else {
        await remove(ref(db, `schedules/${user.uid}/${id}`));
      }
      alert('Đã xoá buổi học.');
      navigate('/teaching-schedule');
    } catch (error) {
      alert('Xoá thất bại: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Timing Logic
  const checkAttendanceStatus = () => {
    if (!session) return { canMark: false, autoAbsent: false };
    const now = new Date();
    const sessionDate = new Date(date);
    const [hours, minutes] = session.startTime.split(':');
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    const bufferStart = new Date(startDateTime.getTime());
    const midnight = new Date(sessionDate);
    midnight.setHours(23, 59, 59, 999);
    const canMark = now >= bufferStart && now <= midnight;
    const isPastMidnight = now > midnight;
    // Auto-absent only if NO student has been marked
    const anyMarked = Object.values(studentsAttendance).some(s => s.status && s.status !== '');
    const autoAbsent = isPastMidnight && !anyMarked;
    return { canMark, autoAbsent, isPastMidnight };
  };

  const { canMark, autoAbsent, isPastMidnight } = checkAttendanceStatus();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return <div className="p-10 text-center text-slate-500">Buổi học không tồn tại.</div>;

  const displayDate = date.split('-').reverse().join('/');

  const StarRating = ({ label, value, onSelect, disabled }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] font-medium text-slate-600">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onSelect(star)}
            className={`text-lg transition-colors ${star <= value ? 'text-amber-400' : 'text-slate-200'
              } ${!disabled ? 'hover:scale-110' : 'cursor-default'}`}
          >
            <i className={star <= value ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
          </button>
        ))}
      </div>
    </div>
  );

  // Check if any student has attendance for the delete button logic
  const anyStudentAttended = Object.values(studentsAttendance).some(s => s.status && s.status !== '');

  return (
    <>
      <TutorNavbar activePage="teaching-schedule" />

      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-300 text-slate-500 hover:text-blue-500 transition-colors shrink-0">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 border-b border-transparent">
                  📅 Buổi dạy <span className="text-slate-500 font-normal">Ngày {displayDate}</span>
                </h1>
                <p className="text-[14px] text-slate-400 mt-1">Quản lý buổi dạy của bạn và điểm danh</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowHomeworkModal(true)}
                className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px] flex items-center justify-center"
              >
                Giao bài tập
              </button>
              {!anyStudentAttended && !isPastMidnight && !autoAbsent && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white font-semibold px-4 py-3 sm:py-2 rounded-2xl sm:rounded-xl text-[14px] sm:text-[13px] hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center"
                >
                  Xoá
                </button>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-slate-300 p-6 md:p-7 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lớp</p>
                  <p className="text-[14px] font-semibold text-slate-700">{session.className}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày</p>
                  <p className="text-[14px] font-semibold text-slate-700">{displayDate}</p>
                </div>
                <div className="sm:hidden lg:block">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cách thức</p>
                  <p className="text-[14px] font-semibold text-slate-700">{session.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Môn học</p>
                  <p className="text-[14px] font-semibold text-slate-700">{session.subject || 'Đại số'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Thời gian</p>
                  <p className="text-[14px] font-semibold text-slate-700">{session.startTime} - {session.endTime}</p>
                </div>
                <div className="hidden sm:block lg:hidden">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cách thức</p>
                  <p className="text-[14px] font-semibold text-slate-700">{session.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Học phí</p>
                  <p className="text-[14px] font-bold text-emerald-600">
                    {session.price ? `${session.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} VNĐ` : 'Chưa cài đặt'}
                  </p>
                </div>
              </div>
            </div>
            {session.link && (
              <div className="mt-6 pt-5 border-t border-slate-300">
                <a href={session.link} target="_blank" rel="noreferrer" className="text-blue-500 font-semibold text-[13px] flex items-center gap-1.5 hover:underline">
                  <i className="fa-solid fa-link text-xs"></i> Tham gia buổi học
                </a>
              </div>
            )}
          </div>

          {/* Attendance & Evaluation: Per Student Cards */}
          <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
            <div className="px-7 py-5 bg-slate-50/50 border-b border-slate-300 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-800">
                Điểm danh & Đánh giá 
                <span className="text-slate-400 font-normal ml-2">({studentsList.length} học sinh)</span>
              </h2>
              {isPastMidnight && (
                <span className="text-[11px] font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                  <i className="fa-solid fa-clock mr-1"></i> Đã quá hạn điểm danh
                </span>
              )}
            </div>

            <div className="p-7 space-y-6">
              {studentsList.length === 0 ? (
                <p className="text-center text-slate-400 py-8 italic">Chưa có học sinh nào trong lớp này.</p>
              ) : (
                studentsList.map((studentName) => {
                  const studentData = studentsAttendance[studentName] || defaultStudentData();
                  const studentAutoAbsent = isPastMidnight && !studentData.status;

                  return (
                    <div key={studentName} className="border border-slate-200 rounded-2xl overflow-hidden">
                      {/* Student Header */}
                      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-[13px]">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="text-[14px] font-bold text-slate-800">{studentName}</h3>
                        </div>
                        {/* Status Badge */}
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                          studentData.status === 'present'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : studentData.status === 'absent' || studentAutoAbsent
                              ? 'bg-red-50 text-red-500 border border-red-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {studentData.status === 'present' ? '✅ Có mặt' :
                           studentData.status === 'absent' || studentAutoAbsent ? '❌ Vắng' : '⏳ Chưa điểm danh'}
                        </span>
                      </div>

                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Left: Attendance + Note */}
                          <div className="flex-1 space-y-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => canMark && updateStudentField(studentName, 'status', 'absent')}
                                disabled={!canMark}
                                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                                  studentData.status === 'absent' || studentAutoAbsent
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                Vắng
                              </button>
                              <button
                                onClick={() => canMark && updateStudentField(studentName, 'status', 'present')}
                                disabled={!canMark}
                                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                                  studentData.status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                Có mặt
                              </button>
                            </div>
                            {studentAutoAbsent && <p className="text-[11px] text-red-400 italic font-medium">* Tự động đánh vắng do quá hạn 24:00</p>}

                            <textarea
                              value={studentData.note || ''}
                              onChange={(e) => canMark && updateStudentField(studentName, 'note', e.target.value)}
                              placeholder={`Ghi chú cho ${studentName}...`}
                              disabled={!canMark}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] text-slate-700 focus:bg-white focus:border-blue-400 outline-none transition-all resize-none h-[80px] disabled:opacity-70"
                            />
                          </div>

                          {/* Right: Evaluation */}
                          <div className="w-full lg:w-[240px]">
                            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <StarRating
                                label="Ý thức"
                                value={studentData.eval_consciousness || 0}
                                onSelect={(v) => updateStudentField(studentName, 'eval_consciousness', v)}
                                disabled={!canMark}
                              />
                              <StarRating
                                label="Tiến bộ"
                                value={studentData.eval_progress || 0}
                                onSelect={(v) => updateStudentField(studentName, 'eval_progress', v)}
                                disabled={!canMark}
                              />
                              <StarRating
                                label="Tư duy"
                                value={studentData.eval_thinking || 0}
                                onSelect={(v) => updateStudentField(studentName, 'eval_thinking', v)}
                                disabled={!canMark}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Homework Section for each student */}
                        {assignments.length > 0 && (
                          <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-white">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <i className="fa-solid fa-book-open text-[10px]"></i>
                               Bài tập buổi này
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {assignments.map(assignment => {
                                  // Find student profile to get Auth ID for submission lookup
                                  const studentProfile = Object.values(studentsListDetailed).find(s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim());
                                  const studentAuthId = studentProfile?.studentAuthId;
                                  const submission = studentAuthId ? assignment.submissions?.[studentAuthId] : null;

                                  return (
                                     <div key={assignment.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                           <div className="min-w-0">
                                              <p className="text-[13px] font-bold text-slate-800 truncate" title={assignment.title}>{assignment.title}</p>
                                              <Link 
                                                to={`/assignment-detail/${user?.uid}/${id}/${date}/${assignment.id}`}
                                                className="text-[10px] text-blue-500 font-bold hover:underline"
                                              >
                                                Xem chi tiết →
                                              </Link>
                                           </div>
                                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                                              submission ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                           }`}>
                                              {submission ? 'Đã nộp' : 'Chưa nộp'}
                                           </span>
                                        </div>

                                        {submission && (
                                           <div className="space-y-2 pt-1 border-t border-slate-200/50">
                                              <div className="flex items-center justify-between gap-2">
                                                 <a 
                                                   href={submission.fileUrl} 
                                                   target="_blank" 
                                                   rel="noreferrer"
                                                   className="text-[11px] text-blue-600 font-bold flex items-center gap-1 hover:underline truncate"
                                                 >
                                                    <i className="fa-solid fa-file-arrow-down"></i>
                                                    {submission.fileName || 'Tệp đính kèm'}
                                                 </a>
                                                 {submission.grade !== undefined && submission.grade !== '' && (
                                                    <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black shrink-0">
                                                       {submission.grade}/10
                                                    </div>
                                                 )}
                                              </div>
                                              {submission.feedback && (
                                                 <p className="text-[10px] text-slate-500 italic line-clamp-1" title={submission.feedback}>
                                                    “{submission.feedback}”
                                                 </p>
                                              )}
                                           </div>
                                        )}
                                     </div>
                                  );
                               })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Assignments summary */}
              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Bài tập đã giao</p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{assignmentCount}</p>
                </div>
              </div>
            </div>

            {/* Save Button Footer */}
            <div className="px-7 py-5 bg-slate-50/30 border-t border-slate-300 flex justify-center sm:justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !canMark}
                className="w-full sm:w-auto bg-blue-600 text-white font-bold px-10 py-3 rounded-2xl sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer />

      {user && (
        <AssignHomeworkModal
          isOpen={showHomeworkModal}
          onClose={() => setShowHomeworkModal(false)}
          userId={user.uid}
          scheduleId={id}
          date={date}
          className={session.className}
        />
      )}
    </>
  );
}

export default SessionDetail;
