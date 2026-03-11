import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function StudentNavbar({ activePage }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({ uid: 'mock-student-id' });
  const [studentProfile, setStudentProfile] = useState({ name: 'Học sinh mẫu' });
  const [enrolledClassNames, setEnrolledClassNames] = useState(['Toán 12', 'Vật lý 11']);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'student');

  // Mock notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Bài tập mới', body: 'Bạn có bài tập mới môn Toán.', timestamp: new Date().toISOString(), isRead: false },
    { id: 2, title: 'Lịch học', body: 'Lịch học Thứ 3 tuần tới đã được cập nhật.', timestamp: new Date().toISOString(), isRead: true }
  ]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const navLinks = [
    { title: 'Thông tin học tập', path: '/student-dashboard', id: 'dashboard' },
    { title: 'Giáo trình', path: '/student-syllabus', id: 'syllabus' }
  ];

  if (activeRole === 'parent') {
    navLinks.push({ title: 'Thanh toán', path: '/parent-payment', id: 'payment' });
  }

  return (
    <header className="fixed top-0 left-0 w-full py-3 z-50 bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* Logo */}
        {/* Logo */}
        <Link to="/student-home" className="flex items-center gap-2 group">
          <img 
            src="/logo.svg" 
            alt="Sổ tay Gia sư" 
            className="h-9 w-9 md:h-11 md:w-11 object-contain transition-transform group-hover:scale-105" 
          />
          <span className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
            Sổ tay <span className="text-blue-500">Gia sư</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.id}
              to={link.path} 
              className={`text-sm font-medium transition-colors ${
                activePage === link.id 
                ? 'text-blue-500 border-b-2 border-blue-500 pb-0.5' 
                : 'text-slate-500 hover:text-blue-500'
              }`}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        {/* Actions Container */}
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-slate-500 hover:text-blue-500 transition-colors p-2"
            >
              <i className="fa-regular fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-[2px] border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-[14px]">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[12px] text-blue-600 font-medium hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-[13px]">
                      Không có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => { markAsRead(notif.id); setShowNotifications(false); }}
                        className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                          <div className="flex-1">
                            <p className={`text-[13px] ${!notif.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{notif.body}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                              {new Date(notif.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200"></div>

          {/* Role Badge */}
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
            activeRole === 'parent' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            <i className={`fa-solid ${activeRole === 'parent' ? 'fa-user-group' : 'fa-user-graduate'}`}></i>
            <span className="hidden sm:inline">{activeRole === 'parent' ? 'Phụ huynh' : 'Học sinh'}</span>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200"></div>

          <button 
            onClick={handleLogout}
            className="hidden md:flex text-sm font-semibold text-red-500 hover:text-red-600 transition-colors items-center gap-2"
          >
            Đăng xuất <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-2xl text-slate-800 p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 absolute top-full left-0 w-full shadow-lg z-[90] animate-in slide-in-from-top duration-300">
           <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${activePage === link.id
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
              >
                {link.title}
                <i className="fa-solid fa-chevron-right text-[10px] opacity-30"></i>
              </Link>
            ))}
            <div className="h-px bg-slate-100 my-2"></div>
            <button 
              onClick={() => { handleLogout(); setIsMenuOpen(false); }}
              className="flex items-center gap-3 p-3 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-all text-left w-full"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              Đăng xuất
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default StudentNavbar;
