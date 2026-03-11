import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import AddToClassModal from '../../../components/tutor/AddToClassModal';
import EditStudentModal from '../../../components/tutor/EditStudentModal';
import CreateStudentAccountModal from '../../../components/tutor/CreateStudentAccountModal';

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchStudentData(currentUser.uid, id);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [id, navigate]);

  const fetchStudentData = (uid, studentId) => {
    const studentRef = ref(db, `students/${uid}/${studentId}`);
    const classesRef = ref(db, `classes/${uid}`);

    onValue(studentRef, (profileSnapshot) => {
      const profileData = profileSnapshot.val() || { name: studentId }; // Fallback if it's just a name-based ID
      
      onValue(classesRef, (classesSnapshot) => {
        const classesData = classesSnapshot.val() || {};
        const enrolledClasses = [];
        
        // Find classes where this student is selected
        Object.entries(classesData).forEach(([classId, c]) => {
          if (c.selectedStudents && Array.isArray(c.selectedStudents)) {
            if (c.selectedStudents.includes(profileData.name || studentId)) {
              enrolledClasses.push({
                id: classId,
                ...c
              });
            }
          }
        });

        setStudent({
          ...profileData,
          enrolledClasses
        });
        setLoading(false);
      });
    });
  };

  const dayMap = {
    'T2': 'Thứ hai', 'T3': 'Thứ ba', 'T4': 'Thứ tư', 'T5': 'Thứ năm', 'T6': 'Thứ sáu', 'T7': 'Thứ bảy', 'CN': 'Chủ nhật'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <>
      <TutorNavbar activePage="students" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header Card */}
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] p-6 md:p-8 border border-slate-100 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 w-full lg:w-auto">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-3xl font-black shrink-0">
                {student.name?.charAt(0)}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-[28px] font-bold text-slate-800 tracking-tight">{student.name}</h1>
                <p className="text-[14px] text-slate-500 font-medium">
                  {student.grade ? `Lớp ${student.grade}` : 'Chưa cập nhật khối'} • {student.school || 'Trường học chưa cập nhật'}
                </p>
                <div className="pt-1 flex justify-center sm:justify-start">
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                    student.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {student.status === 'active' ? 'Hoạt động' : 'Tạm nghỉ'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-6 py-3 rounded-2xl hover:bg-slate-200 transition-all text-[14px]"
              >
                Sửa
              </button>
              {!student.hasAccount ? (
                <button 
                  onClick={() => setShowAccountModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px]"
                >
                  <i className="fa-solid fa-key mr-2"></i> Tạo tài khoản Đăng nhập
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl flex items-center gap-2 overflow-hidden">
                  <i className="fa-solid fa-circle-check text-emerald-500 flex-shrink-0"></i>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider truncate">Tài khoản Học viên</p>
                    <p className="text-[13px] font-bold text-slate-700 mt-0.5 truncate">{student.studentEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail Grid */}
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] p-6 md:p-10 border border-slate-100 relative min-h-[500px]">
            
            <div className="max-w-3xl space-y-12">
              {/* Overview */}
              <div>
                <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Tổng quan</h2>
                <div className="space-y-4 ml-1">
                  <div className="flex gap-2">
                    <span className="text-[14px] font-bold text-slate-800 w-32">Số điện thoại:</span>
                    <span className="text-[14px] text-slate-600 font-medium">{student.phone || '0123456789'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[14px] font-bold text-slate-800 w-32">Địa chỉ:</span>
                    <span className="text-[14px] text-slate-600 font-medium">{student.address || 'Đại học FPT'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[14px] font-bold text-slate-800 w-32">Bố mẹ:</span>
                    <span className="text-[14px] text-slate-600 font-medium">
                      {student.parentName || 'Nguyễn thị AA'} - {student.parentPhone || '0987654321'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classes */}
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1">Lớp học</h2>
                  <button 
                    onClick={() => setShowAddClassModal(true)}
                    className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-6 py-2.5 rounded-2xl hover:bg-slate-200 transition-all text-[13px]"
                  >
                    Thêm vào lớp
                  </button>
                </div>
                <div className="space-y-4 ml-1">
                  {student.enrolledClasses?.length > 0 ? (
                    student.enrolledClasses.map(c => (
                      <div key={c.id}>
                        <p className="text-[14px] font-bold text-slate-800">{c.name}: 
                          <span className="font-medium text-slate-600 ml-2">
                            {c.selectedDays?.map(d => dayMap[d]).join(', ')} - {c.startTime}
                          </span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[14px] text-slate-400 italic">Chưa đăng ký lớp học nào</p>
                  )}
                </div>
              </div>

              {/* Homework */}
              <div className="relative">
                <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Bài tập</h2>
                <div className="ml-1 cursor-pointer group w-fit" onClick={() => navigate(`/students/${id}/assignments`)}>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Xem bài tập của học sinh</p>
                      <p className="text-[13px] text-slate-500 font-medium mt-0.5">Quản lý và thống kê chi tiết</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300 ml-4 group-hover:text-blue-500 transition-colors"></i>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Ghi chú</h2>
                <div className="ml-1">
                  <p className="text-[14px] text-slate-500 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {student.notes || 'Chưa có ghi chú nào...'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
      <Footer />
      {user && (
        <AddToClassModal 
          isOpen={showAddClassModal}
          onClose={() => setShowAddClassModal(false)}
          userId={user.uid}
          preSelectedStudentName={student.name}
        />
      )}
      {user && student && (
        <EditStudentModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={user.uid}
          studentData={{ id, ...student }}
        />
      )}
      {user && (
        <CreateStudentAccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          userId={user.uid}
          studentId={id}
          studentName={student.name}
        />
      )}
    </>
  );
}

export default StudentDetail;
