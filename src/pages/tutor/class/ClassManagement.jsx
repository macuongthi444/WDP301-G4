import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import CreateClassModal from '../../../components/tutor/CreateClassModal';

function ClassManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ uid: 'mock-user' });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Mock data simulation
    const mockClasses = [
      {
        id: 'class-1',
        name: 'Toán 12 - Ôn thi đại học',
        teachingMode: 'online',
        selectedStudents: ['Nguyễn Văn A', 'Trần Thị B'],
        teachingDays: 'Thứ 2, Thứ 4, Thứ 6',
        status: 'active'
      },
      {
        id: 'class-2',
        name: 'Vật lý 11',
        teachingMode: 'offline',
        students: 'Lê Văn C',
        teachingDays: 'Thứ 3, Thứ 5',
        status: 'active'
      },
      {
        id: 'class-3',
        name: 'Hóa học 10',
        teachingMode: 'online',
        selectedStudents: ['Phạm Văn D'],
        teachingDays: 'Thứ 7',
        status: 'inactive'
      }
    ];

    const timer = setTimeout(() => {
      setClasses(mockClasses);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredClasses = classes.filter(c => {
    const name = c.name || '';
    const students = c.students || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      students.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: classes.length,
    active: classes.filter(c => c.status === 'active').length,
    inactive: classes.filter(c => c.status === 'inactive').length,
    pendingHomework: 0 // Placeholder for now
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <TutorNavbar activePage="class" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-6">
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 flex items-center gap-3">
                <i className="fa-solid fa-book-open text-blue-500 text-[20px]"></i>
                Quản lý lớp học
              </h1>
              <p className="text-slate-400 text-sm mt-1">Theo dõi và quản lý các lớp học của bạn</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px]"
            >
              Thêm lớp học
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Tổng số', value: stats.total, color: 'slate' },
              { label: 'Hoạt động', value: stats.active, color: 'emerald' },
              { label: 'Không hoạt động', value: stats.inactive, color: 'amber' },
              { label: 'Chưa hoàn thành bài tập', value: stats.pendingHomework, color: 'red' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm transition-shadow">
                <p className="text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-2xl md:text-[28px] font-black text-slate-800 leading-none">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="text"
                placeholder="Tìm kiếm lớp học..."
                className="w-full bg-white border border-slate-300 rounded-2xl py-3 pl-12 pr-4 text-[14px] focus:border-blue-400 outline-none transition-all shadow-sm text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-slate-300 rounded-2xl py-3 px-6 text-[14px] outline-none shadow-sm focus:border-blue-400 text-slate-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Lớp</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Hình thức</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Học sinh</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Ngày học</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClasses.length > 0 ? filteredClasses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/class-detail/${item.id}`)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <td className="px-8 py-5">
                        <p className="text-[15px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors uppercase">{item.name}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[13px] font-semibold px-3 py-1 rounded-lg ${item.teachingMode === 'online' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {item.teachingMode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] text-slate-500 font-medium max-w-[240px] truncate">
                          {Array.isArray(item.selectedStudents) ? item.selectedStudents.join(', ') : (item.students || 'Chưa cập nhật')}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className={`text-[13px] font-medium ${item.teachingDays === 'Chưa có ngày dạy' ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                          {item.teachingDays}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'active' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                          {item.status === 'active' ? 'Hoạt động' : 'Nghỉ'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                        <i className="fa-solid fa-folder-open text-4xl block mb-4 opacity-20"></i>
                        Không tìm thấy lớp học nào.
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
        <CreateClassModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={user.uid}
        />
      )}
    </>
  );
}

export default ClassManagement;
