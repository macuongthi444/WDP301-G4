import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import AddStudentModal from '../../../components/tutor/AddStudentModal';

function StudentManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
  }, [navigate]);

  const fetchData = (uid) => {
    const classesRef = ref(db, `classes/${uid}`);
    const studentsRef = ref(db, `students/${uid}`);
    const schedulesRef = ref(db, `schedules/${uid}`);

    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    // Combine data from classes, students, and schedules
    onValue(classesRef, (classSnapshot) => {
      const classData = classSnapshot.val() || {};

      onValue(studentsRef, (studentSnapshot) => {
        const profileData = studentSnapshot.val() || {};
        
        onValue(schedulesRef, (schedulesSnapshot) => {
          const schedulesData = schedulesSnapshot.val() || {};
          
          // Map classId -> Set of days
          const classDaysMap = {};
          Object.values(schedulesData).forEach(s => {
            if (s.classId && s.dayOfWeek) {
              if (!classDaysMap[s.classId]) classDaysMap[s.classId] = new Set();
              classDaysMap[s.classId].add(s.dayOfWeek);
            }
          });

          const studentMap = {};

          // 1. Process from classes
          Object.entries(classData).forEach(([classId, c]) => {
            if (c.selectedStudents && Array.isArray(c.selectedStudents)) {
              const classDays = classDaysMap[classId] || new Set();
              
              c.selectedStudents.forEach(name => {
                if (!studentMap[name]) {
                  studentMap[name] = {
                    id: name,
                    name: name,
                    classes: [],
                    days: new Set(),
                    status: 'inactive',
                    grade: c.subject?.match(/\d+/)?.[0] || '',
                    fromProfile: false
                  };
                }
                studentMap[name].classes.push(c.name);
                classDays.forEach(day => studentMap[name].days.add(day));
                if (c.status === 'active') studentMap[name].status = 'active';
              });
            }
          });

          // 2. Process from profiles (and override if exists)
          Object.entries(profileData).forEach(([id, profile]) => {
            const name = profile.name;
            if (studentMap[name]) {
              studentMap[name] = { ...studentMap[name], ...profile, id, fromProfile: true };
            } else {
              studentMap[name] = {
                id,
                ...profile,
                classes: [],
                days: new Set(),
                status: 'active',
                fromProfile: true
              };
            }
          });

          const studentList = Object.values(studentMap).map(s => {
            const sortedDays = Array.from(s.days).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
            const daysStr = sortedDays.length > 0 
              ? sortedDays.map(d => dayMap[d]).join(', ') 
              : 'Chưa có lịch học';

            return {
              ...s,
              daysStr: daysStr,
              classesStr: s.classes?.length > 0 ? s.classes.join(', ') : 'Chưa xếp lớp'
            };
          });

          setStudents(studentList);
          setLoading(false);
        });
      });
    });
  };

  const dayMap = {
    'T2': 'Thứ 2', 'T3': 'Thứ 3', 'T4': 'Thứ 4', 'T5': 'Thứ 5', 'T6': 'Thứ 6', 'T7': 'Thứ 7', 'CN': 'Chủ nhật'
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classesStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
    pendingHomework: 0 // Placeholder
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <TutorNavbar activePage="students" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-6">
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 flex items-center gap-3">
                <i className="fa-solid fa-user-group text-blue-500 text-[22px]"></i>
                Quản lý học sinh
              </h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px] flex items-center justify-center gap-3 group"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              Thêm học sinh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Tổng số', value: stats.total, color: 'slate' },
              { label: 'Hoạt động', value: stats.active, color: 'emerald' },
              { label: 'Không hoạt động', value: stats.inactive, color: 'slate' },
              { label: 'Nợ bài tập', value: stats.pendingHomework, color: 'red' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm transition-shadow">
                <p className="text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-2xl md:text-[28px] font-black text-slate-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Tìm kiếm học sinh..."
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-11 pr-4 text-[13px] outline-none focus:border-blue-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-blue-400 transition-all shadow-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-white min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Tên</th>
                    <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Khối</th>
                    <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Lớp</th>
                    <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Ngày học</th>
                    <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        onClick={() => navigate(`/student-detail/${student.id}`)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group text-slate-600"
                      >
                        <td className="px-8 py-5">
                          <p className="text-[14px] font-semibold text-slate-800">{student.name}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[14px] text-slate-500 font-medium">{student.grade || '--'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[14px] text-slate-500 font-medium">{student.classesStr}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className={`text-[14px] font-medium ${student.daysStr === 'Chưa có lịch học' ? 'text-slate-400 italic' : 'text-slate-500'}`}>
                            {student.daysStr}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-block ${student.status === 'active'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                            }`}>
                            {student.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <i className="fa-solid fa-user-slash text-4xl text-slate-200 mb-4 block"></i>
                        <p className="text-slate-400 font-medium">Không tìm thấy học sinh nào</p>
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
      {user && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={user.uid}
        />
      )}
    </>
  );
}

export default StudentManagement;
