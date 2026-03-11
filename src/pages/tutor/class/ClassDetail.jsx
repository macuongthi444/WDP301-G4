import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import EditClassModal from '../../../components/tutor/EditClassModal';

function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({ uid: 'mock-user' });
  const [classData, setClassData] = useState(null);
  const [syllabusName, setSyllabusName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Mock data simulation
    const mockClassDetail = {
      id: id,
      name: id === 'class-1' ? 'Toán 12 - Ôn thi đại học' : 'Vật lý 11',
      teachingMode: id === 'class-1' ? 'online' : 'offline',
      status: 'active',
      link: 'https://meet.google.com/abc-defg-hij',
      address: '123 Đường ABC, Hà Nội',
      curriculum: 'syllabus-1',
      selectedDays: ['T2', 'T4', 'T6'],
      startTime: '18:00',
      selectedStudents: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'],
      note: 'Chuẩn bị bài tập về nhà kỹ càng trước khi lên lớp.'
    };

    const timer = setTimeout(() => {
      setClassData(mockClassDetail);
      setSyllabusName('Giáo trình ôn thi THPT Quốc gia');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  const removeStudent = (studentName) => {
    if (!window.confirm(`Xác nhận xóa học sinh ${studentName}?`)) return;
    setClassData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.filter(s => s !== studentName)
    }));
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

  if (!classData) return null;

  return (
    <>
      <TutorNavbar activePage="class" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header Card */}
          <div className="bg-white shadow-md transition-shadow rounded-[24px] p-6 md:p-8 border border-slate-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <i className="fa-solid fa-graduation-cap text-xl"></i>
                </div>
                <h1 className="text-2xl md:text-[26px] font-bold text-slate-900">{classData.name}</h1>
              </div>
              <p className="text-[14px] text-slate-500 mb-4 ml-0 md:ml-[52px]">Hình thức: {classData.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</p>
              <div className="ml-0 md:ml-[52px]">
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold ${classData.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {classData.status === 'active' ? 'Hoạt động' : 'Nghỉ'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px]"
            >
              Chỉnh sửa
            </button>
          </div>

          {/* Details Card */}
          <div className="bg-white shadow-md transition-shadow rounded-[24px] p-6 md:p-8 border border-slate-100 space-y-10">

            {/* Overview Section */}
            <div>
              <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Tổng quan</h2>
              <div className="space-y-4">
                {classData.teachingMode === 'online' && (
                  <div className="bg-blue-50/50 p-4 rounded-xl flex items-center gap-2">
                    <span className="text-[14px] font-bold text-slate-800">Online Link:</span>
                    <a href={classData.link} target="_blank" rel="noopener noreferrer" className="text-[14px] text-blue-600 hover:underline truncate">
                      {classData.link}
                    </a>
                  </div>
                )}
                {classData.teachingMode === 'offline' && (
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-2">
                    <span className="text-[14px] font-bold text-slate-800">Địa điểm:</span>
                    <span className="text-[14px] text-slate-600">{classData.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-1">
                  <span className="text-[14px] font-bold text-slate-800">Giáo trình:</span>
                  {classData.curriculum ? (
                    <Link to={syllabusName !== classData.curriculum && syllabusName !== 'Không có' ? `/syllabus-detail/${classData.curriculum}` : '#'} className={`text-[14px] ${syllabusName !== classData.curriculum && syllabusName !== 'Không có' ? 'text-blue-600 hover:underline' : 'text-slate-600'}`}>
                      {syllabusName || classData.curriculum}
                    </Link>
                  ) : (
                    <span className="text-[14px] text-slate-500 italic">Không có</span>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Lịch dạy</h2>
              <div className="space-y-2 ml-1">
                {classData.selectedDays?.map(day => (
                  <p key={day} className="text-[14px] text-slate-600 font-medium">
                    {dayMap[day]} - {classData.startTime}
                  </p>
                ))}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Học sinh</h2>
              <div className="space-y-4">
                {classData.selectedStudents?.map(student => (
                  <div key={student} className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all group">
                    <span className="text-[14px] font-medium text-slate-600">{student}</span>
                    <button
                      onClick={() => removeStudent(student)}
                      className="text-red-400 hover:text-red-600 p-2 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <i className="fa-regular fa-trash-can text-[18px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h2 className="text-[16px] font-bold text-blue-600 border-b-2 border-blue-600 inline-block pb-1 mb-6">Ghi chú</h2>
              <div className="bg-slate-50/50 p-6 rounded-2xl min-h-[100px]">
                <p className="text-[14px] text-slate-500 italic whitespace-pre-wrap">
                  {classData.note || 'Không có ghi chú nào...'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>
      <Footer />

      {user && (
        <EditClassModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={user.uid}
          classId={id}
        />
      )}
    </>
  );
}

export default ClassDetail;
