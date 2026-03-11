import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import EditAssignmentModal from '../../../components/tutor/EditAssignmentModal';
import { StorageUtils } from '../../../utils/StorageUtils';

function AssignmentDetail() {
  const { userId, scheduleId, date, assignmentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [savingStatus, setSavingStatus] = useState({});
  const [editingGrades, setEditingGrades] = useState({});
  const [students, setStudents] = useState([]);

  // Mock student list based on selectedStudents
  const studentsList = useMemo(() => {
    if (!assignment || !assignment.selectedStudents) return [];
    
    return assignment.selectedStudents.map((studentName, index) => {
      // Find student profile to get Auth ID
      const studentProfile = Object.values(students).find(s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim());
      const studentAuthId = studentProfile?.studentAuthId;
      
      // Get real submission data
      const submission = studentAuthId && assignment.submissions ? assignment.submissions[studentAuthId] : null;
      
      // Use actual saved grade (priority: submission.grade, fallback: assignment.grades[studentName])
      const savedGrade = submission?.grade !== undefined ? submission.grade : (assignment.grades ? assignment.grades[studentName] : undefined);
      const initialScore = savedGrade !== undefined ? savedGrade : '';
      const initialFeedback = submission?.feedback || '';

      return {
        id: index,
        name: studentName,
        authId: studentAuthId,
        submittedAt: submission ? new Date(submission.submittedAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-',
        status: submission ? (savedGrade !== undefined ? 'Đã chấm' : 'Đã nộp') : 'Thiếu',
        score: initialScore,
        feedback: initialFeedback,
        submission: submission
      };
    });
  }, [assignment, students]);

  // Stats calculate
  const stats = useMemo(() => {
    if (!studentsList) return { total: 0, submitted: 0 };
    
    const total = studentsList.length;
    const submitted = studentsList.filter(s => s.status !== 'Thiếu').length;

    return { total, submitted };
  }, [studentsList]);

  // Sync grades and feedbacks state when studentsList changes
  useEffect(() => {
    const newGrades = {};
    const newFeedbacks = {};
    studentsList.forEach(student => {
      newGrades[student.name] = student.score === '' ? '' : student.score;
      newFeedbacks[student.name] = student.feedback || '';
    });
    setGrades(newGrades);
    setFeedbacks(newFeedbacks);
  }, [studentsList]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAssignmentData(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [userId, scheduleId, date, assignmentId, navigate]);

  const fetchAssignmentData = (uid) => {
    // 1. Fetch Students to map name -> authId
    const studentsRef = ref(db, `students/${uid}`);
    onValue(studentsRef, (snapshot) => {
      setStudents(snapshot.val() || {});
    });

    // 2. Get assignment
    const assignmentRef = ref(db, `assignments/${userId}/${scheduleId}/${date}/${assignmentId}`);
    
    // 3. Get schedule to find className
    const scheduleRef = ref(db, `schedules/${userId}/${scheduleId}`);

    onValue(assignmentRef, (assignmentSnapshot) => {
      const assignmentData = assignmentSnapshot.val();
      
      if (assignmentData) {
        onValue(scheduleRef, (scheduleSnapshot) => {
          const scheduleData = scheduleSnapshot.val();
          
          if (scheduleData) {
            // Get class name
            const classesRef = ref(db, `classes/${userId}/${scheduleData.classId}`);
            onValue(classesRef, (classSnapshot) => {
              const classData = classSnapshot.val();
              const className = classData ? classData.name : (scheduleData.className || scheduleData.title || 'Không rõ');
              
              setAssignment({
                ...assignmentData,
                className
              });
              setLoading(false);
            });
          } else {
            setAssignment({
              ...assignmentData,
              className: 'Không rõ'
            });
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Đã nộp':
      case 'Đã chấm':
        return 'bg-green-100 text-green-500 font-bold';
      case 'Thiếu':
      case 'Quá hạn':
        return 'bg-red-300 text-white font-bold';
      default:
        return 'bg-slate-200 text-slate-500 font-bold';
    }
  };

  const handleGradeChange = (studentName, value) => {
    setGrades(prev => ({
      ...prev,
      [studentName]: value
    }));
  };

  const handleFeedbackChange = (studentName, value) => {
    setFeedbacks(prev => ({
      ...prev,
      [studentName]: value
    }));
  };

  const toggleEditGrade = (studentName) => {
    setEditingGrades(prev => ({
      ...prev,
      [studentName]: true
    }));
  };

  const handleSaveGrade = async (studentName) => {
    if (!user || user.uid !== userId) return;

    setSavingStatus(prev => ({ ...prev, [studentName]: 'saving' }));
    
    const grade = grades[studentName];
    const feedback = feedbacks[studentName] || '';
    const studentInfo = studentsList.find(s => s.name === studentName);

    try {
      // 1. Save to old path for backward compatibility
      const oldGradeRef = ref(db, `assignments/${userId}/${scheduleId}/${date}/${assignmentId}/grades/${studentName}`);
      await set(oldGradeRef, grade);

      // 2. Save to NEW unified path (indexed by UID) if AuthId exists
      if (studentInfo?.authId) {
        const submissionRef = ref(db, `assignments/${userId}/${scheduleId}/${date}/${assignmentId}/submissions/${studentInfo.authId}`);
        await update(submissionRef, {
            grade: grade,
            feedback: feedback
        });

        // 3. Send Notification
        try {
          await fetch('https://asia-southeast1-tutor-note-6e8b1.cloudfunctions.net/sendNotification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: studentInfo.authId,
              title: `📝 Đã có kết quả bài tập!`,
              body: `Gia sư vừa chấm điểm bài "${assignment.title}". Điểm: ${grade}/10. ${feedback ? 'Nhận xét: ' + feedback : ''}`,
              targetRole: null 
            })
          });
        } catch (err) {
          console.error('Lỗi khi gửi thông báo:', err);
        }
      }

      setSavingStatus(prev => ({ ...prev, [studentName]: 'success' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [studentName]: null }));
        setEditingGrades(prev => ({ ...prev, [studentName]: false }));
      }, 1000);
    } catch (error) {
      console.error('Error saving grade:', error);
      setSavingStatus(prev => ({ ...prev, [studentName]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <p className="text-slate-500 text-lg mb-4">Không tìm thấy bài tập.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-bold hover:underline">Quay lại</button>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercent = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;

  return (
    <>
      <TutorNavbar />
      <main className="pt-[68px] min-h-screen bg-white pb-20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
            <h1 className="text-2xl md:text-[24px] font-black text-slate-900 flex items-center gap-3">
              <i className="fa-solid fa-book text-blue-500"></i>
              {assignment.title}
            </h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 sm:flex-none bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-[14px]"
              >
                Sửa
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-none bg-blue-300 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-400 transition-all text-[14px]"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-slate-50 rounded-[20px] p-6 md:p-8 border border-slate-100 mb-6 flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-[20px] font-bold text-slate-900 mb-2">Mô tả</h2>
              <p className="text-[14px] text-slate-700 leading-relaxed mb-6">
                {assignment.description || 'Không có mô tả cho bài tập này.'}
              </p>
              
              <div className="flex flex-wrap gap-4 md:gap-8 text-[13px] text-slate-600 font-medium">
                <p><span className="text-slate-400">Lớp:</span> {assignment.className}</p>
                <p><span className="text-slate-400">Hạn nộp:</span> {assignment.dueDate} {assignment.dueTime || '23:59'}</p>
                <p><span className="text-slate-400">Tổng số học sinh:</span> {stats.total}</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-slate-200/50 rounded-2xl p-6 w-full lg:w-72 flex flex-col justify-center items-center">
              <p className="text-[12px] text-slate-500 font-bold mb-1">Tiến độ nộp bài</p>
              <p className="text-[28px] font-black text-slate-800 mb-4">{stats.submitted}/{stats.total}</p>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-slate-50 rounded-[20px] p-8 border border-slate-100 mb-6">
            <h2 className="text-[20px] font-bold text-slate-900 mb-4">Tệp đính kèm</h2>
            {assignment.fileUrl || assignment.fileName ? (
              <div className="flex flex-col gap-4">
                <a 
                  href={assignment.fileUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[14px] text-blue-500 font-medium hover:underline inline-flex items-center gap-2"
                >
                  <i className="fa-solid fa-paperclip"></i> {assignment.fileName || 'Tài liệu đính kèm'}
                </a>
                
                {StorageUtils.isImage(assignment.fileName) && (
                  <div className="mt-2 max-w-2xl bg-white p-4 rounded-2xl border border-slate-200">
                    <img 
                      src={assignment.fileUrl} 
                      alt="Preview" 
                      className="max-w-full h-auto rounded-xl shadow-sm"
                    />
                  </div>
                )}
                
                {assignment.fileUrl?.includes('.pdf') && (
                  <div className="mt-2 w-full h-[600px] bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <iframe src={assignment.fileUrl} className="w-full h-full border-none" title="Assignment PDF"></iframe>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[14px] text-slate-500 italic">Không có tệp đính kèm nào.</p>
            )}
          </div>

          {/* Submissions Table Card */}
          <div className="bg-slate-50 rounded-[20px] pb-6 border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-8 pb-4">
              <h2 className="text-[20px] font-bold text-slate-900">Bài nộp của học sinh</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-200/50">
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[20%]">Học sinh</th>
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[20%]">Đã nộp</th>
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[15%]">Trạng thái</th>
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[10%] text-center">Điểm</th>
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[25%]">Nhận xét</th>
                    <th className="py-4 px-8 text-[14px] font-bold text-slate-700 w-[10%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.length > 0 ? (
                    studentsList.map((student, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-100/30 transition-colors"
                      >
                        <td className="py-5 px-8">
                          <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-slate-800">{student.name}</p>
                            {student.submission?.note && (
                              <p className="text-[11px] text-slate-400 italic font-medium truncate max-w-[150px]" title={student.submission.note}>
                                  "{student.submission.note}"
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <div className="space-y-1">
                            <p className="text-[13px] font-medium text-slate-600">{student.submittedAt}</p>
                            {student.submission?.fileUrl && (
                              <a 
                                href={student.submission.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1"
                              >
                                 <i className="fa-solid fa-paperclip text-[10px]"></i>
                                 {student.submission.fileName || 'Tệp bài làm'}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <span className={`px-4 py-1.5 rounded-full text-[12px] ${getStatusStyle(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-5 px-8">
                          {student.score === '-' ? (
                            <p className="text-[13px] font-medium text-slate-600 text-center">-</p>
                          ) : editingGrades[student.name] ? (
                            <div className="flex items-center justify-center gap-1">
                              <input 
                                type="text" 
                                value={grades[student.name] || ''}
                                onChange={(e) => handleGradeChange(student.name, e.target.value)}
                                className="w-8 border-b border-blue-400 text-center text-[13px] font-black text-blue-600 outline-none bg-blue-50/50 pb-0.5"
                                placeholder="_"
                              />
                              <span className="text-[13px] font-medium text-slate-400">/10</span>
                            </div>
                          ) : (
                            <p className="text-[13px] font-black text-slate-800 text-center">
                              {student.score !== '' ? `${student.score}/10` : '-/10'}
                            </p>
                          )}
                        </td>
                        <td className="py-5 px-8">
                           {editingGrades[student.name] ? (
                              <textarea
                                 value={feedbacks[student.name] || ''}
                                 onChange={(e) => handleFeedbackChange(student.name, e.target.value)}
                                 placeholder="Nhận xét..."
                                 className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 focus:border-blue-400 outline-none transition-all resize-none h-10"
                              />
                           ) : (
                              <p className="text-[12px] text-slate-500 italic truncate max-w-[180px]" title={student.feedback}>
                                 {student.feedback || '-'}
                              </p>
                           )}
                        </td>
                        <td className="py-5 px-8">
                          {student.status === 'Thiếu' ? (
                            <span className="text-[13px] text-slate-400 font-medium">-</span>
                          ) : !editingGrades[student.name] ? (
                            <button 
                              onClick={() => toggleEditGrade(student.name)}
                              className="text-[13px] text-blue-500 font-black hover:underline hover:text-blue-600 transition-colors"
                            >
                              Chấm điểm
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleSaveGrade(student.name)}
                              disabled={savingStatus[student.name] === 'saving'}
                              className={`${
                                savingStatus[student.name] === 'saving' 
                                  ? 'bg-slate-400' 
                                  : savingStatus[student.name] === 'success'
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20'
                              } text-white font-bold px-4 py-1.5 rounded-lg text-[12px] transition-colors`}
                            >
                              {savingStatus[student.name] === 'saving' ? 'Đang lưu...' : savingStatus[student.name] === 'success' ? 'Đã lưu' : 'Lưu'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <p className="text-[14px] text-slate-500 font-medium">Chưa có bài nộp nào.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
      <Footer />
      <EditAssignmentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        userId={userId} 
        scheduleId={scheduleId} 
        date={date} 
        assignmentId={assignmentId}
        currentAssignment={assignment}
      />
    </>
  );
}

export default AssignmentDetail;
