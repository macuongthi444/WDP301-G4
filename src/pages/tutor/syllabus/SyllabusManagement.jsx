import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import UploadSyllabusModal from '../../../components/tutor/UploadSyllabusModal';
import FileThumbnail from '../../../components/shared/FileThumbnail';

function SyllabusManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [syllabuses, setSyllabuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    // Mock user and syllabus simulation
    const mockUser = { uid: 'mock-tutor-id', displayName: 'Gia sư mẫu' };
    setUser(mockUser);
    
    const mockSyllabuses = [
      {
        id: 'syl-1',
        name: 'Toán 12 - Giải tích & Hình học',
        subject: 'Toán học',
        grade: 'Lớp 12',
        uploadDate: '2024-01-15T10:00:00Z',
        size: '2.5 MB'
      },
      {
        id: 'syl-2',
        name: 'Vật lý 11 - Cơ bản & Nâng cao',
        subject: 'Vật lý',
        grade: 'Lớp 11',
        uploadDate: '2024-02-10T14:30:00Z',
        size: '1.8 MB'
      },
      {
        id: 'syl-3',
        name: 'Hóa học 10 - Chương trình mới',
        subject: 'Hóa học',
        grade: 'Lớp 10',
        uploadDate: '2024-03-05T09:15:00Z',
        size: '3.2 MB'
      }
    ];

    const timer = setTimeout(() => {
      setSyllabuses(mockSyllabuses);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredSyllabuses = syllabuses.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || s.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['all', ...new Set(syllabuses.map(s => s.subject))];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <TutorNavbar activePage="syllabus" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-6">
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 flex items-center gap-3">
                <i className="fa-solid fa-book text-blue-500 text-[22px]"></i>
                Giáo trình
              </h1>
              <p className="text-slate-400 text-sm mt-1">Quản lý và lưu trữ tài liệu giảng dạy của bạn</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px] flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              Tải giáo trình lên
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="text"
                placeholder="Tìm kiếm giáo trình..."
                className="w-full bg-white border border-slate-300 rounded-2xl py-3 pl-12 pr-4 text-[14px] focus:border-blue-400 outline-none transition-all shadow-sm text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="w-full md:w-auto bg-white border border-slate-300 rounded-2xl py-3 pl-6 pr-10 text-[14px] outline-none shadow-sm focus:border-blue-400 text-slate-600 appearance-none min-w-[140px] cursor-pointer"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">Tất cả môn học</option>
                {subjects.filter(s => s !== 'all').map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Giáo trình</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Khối</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Môn học</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider">Ngày tải lên</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-slate-700 uppercase tracking-wider text-right">Kích thước</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSyllabuses.length > 0 ? filteredSyllabuses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/syllabus-detail/${item.id}`)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <FileThumbnail 
                              filePath={item.filePath}
                              fileName={item.fileName}
                              fileUrl={item.fileUrl}
                              className="w-10 h-10 rounded-xl"
                           />
                           <p className="text-[14px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] text-slate-500 font-medium">{item.grade}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[13px] font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-600">
                          {item.subject}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-500">
                          {new Date(item.uploadDate).toLocaleDateString('en-CA')}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-[13px] font-bold text-slate-700">{item.size || '0 MB'}</p>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                        <i className="fa-solid fa-folder-open text-4xl block mb-4 opacity-20"></i>
                        Không tìm thấy giáo trình nào.
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
        <UploadSyllabusModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          userId={user.uid}
        />
      )}
    </>
  );
}

export default SyllabusManagement;
