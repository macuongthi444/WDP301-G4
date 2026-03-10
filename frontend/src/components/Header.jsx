import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  LogOut,
  Users,
  Calendar,
  BookOpen,
  UserCircle,
  LayoutDashboard,
  BellDot,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/logo.png';
import headerBg from '../assets/header-background.png';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRoles = [], logout, user } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null); // ← Đây là dòng bị thiếu → fix lỗi ReferenceError

  const hasNotification = true; // thay bằng logic thật sau
  const notificationCount = 3;

  const normalizeRole = (role) => String(role || '').toUpperCase();

  const isTutor = userRoles.some(
    (role) => normalizeRole(role).includes('TUTOR') || normalizeRole(role) === 'ROLE_TUTOR'
  );
  const isStudent = userRoles.some(
    (role) => normalizeRole(role).includes('STUDENT') || normalizeRole(role) === 'ROLE_STUDENT'
  );
  const isAdmin = userRoles.some(
    (role) => normalizeRole(role).includes('ADMIN') || normalizeRole(role) === 'ROLE_ADMIN'
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleUserClick = () => {
    if (isLoggedIn) {
      setIsUserDropdownOpen((prev) => !prev);
    } else {
      navigate('/login');
    }
  };

  // Click outside cho cả notification và user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Đóng notification nếu click bên ngoài
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      // Đóng user dropdown nếu click bên ngoài
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    // Chỉ gắn listener khi ít nhất một dropdown đang mở
    if (isNotificationOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isUserDropdownOpen]);

  const stringToColor = (str) => {
    if (!str) return '#6b7280';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return ((words[0][0] || '') + (words[words.length - 1][0] || '')).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <div
      className="sticky top-0 bg-cover bg-center bg-no-repeat relative shadow-sm z-50"
      style={{ backgroundImage: `url(${headerBg})`, minHeight: '100px' }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-purple-600"
            aria-label="Toggle menu"
          >
            <Menu size={28} />
          </button>

          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Tutor Note" className="h-14 sm:h-16 object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10 flex-1 justify-center">
            {isLoggedIn && isAdmin ? (
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/admin/dashboard" className="flex items-center gap-1.5 hover:text-purple-600">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/admin/accounts" className="flex items-center gap-1.5 hover:text-purple-600">
                  <Users size={16} /> Danh sách tài khoản
                </Link>
              </div>
            ) : isLoggedIn && isTutor ? (
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/tutor/students/my" className="flex items-center gap-1.5 hover:text-purple-600">
                  <Users size={16} /> Quản lý học sinh
                </Link>
                <Link to="/tutor/classes" className="flex items-center gap-1.5 hover:text-purple-600">
                  <BookOpen size={16} /> Quản lý lớp học
                </Link>
                <Link to="/tutor/schedule" className="flex items-center gap-1.5 hover:text-purple-600">
                  <Calendar size={16} /> Lịch dạy
                </Link>

                {/* Dropdown Giáo Trình */}
                <div className="relative group">
                  <div className="flex items-center gap-1.5 hover:text-purple-600 cursor-pointer">
                    <BookOpen size={16} />
                    Giáo Trình
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                    <div className="relative pt-3">
                      <div className="absolute -top-3 left-0 right-0 h-6 bg-transparent pointer-events-auto"></div>
                      <div className="py-2">
                        <Link to="/tutor/syllabus" className="flex px-5 py-3.5 hover:bg-purple-50 hover:text-purple-700">
                          <BookOpen size={18} className="mr-3 text-purple-500" /> Giáo trình
                        </Link>
                        <Link to="/tutor/assignments" className="flex px-5 py-3.5 hover:bg-purple-50 hover:text-purple-700">
                          <BookOpen size={18} className="mr-3 text-purple-500" /> Bài tập
                        </Link>
                        <Link to="/tutor/submissions" className="flex px-5 py-3.5 hover:bg-purple-50 hover:text-purple-700">
                          <BookOpen size={18} className="mr-3 text-purple-500" /> Bài nộp
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <Link to="/tutor/ai-assistant" className="flex items-center gap-1.5 hover:text-purple-600">
                  <BookOpen size={16} /> Trợ lý AI
                </Link>
              </div>
            ) : isLoggedIn && isStudent ? (
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/student" className="flex items-center gap-1.5 hover:text-purple-600">
                  <Calendar size={16} /> Thông tin học tập
                </Link>
                <Link to="/student/courses" className="flex items-center gap-1.5 hover:text-purple-600">
                  <BookOpen size={16} /> Khóa học của tôi
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-8 text-sm">
                <Link to="/introduction" className="hover:text-purple-600">Giới Thiệu</Link>
                <Link to="/" className="hover:text-purple-600">Liên Hệ</Link>
              </div>
            )}
          </div>

          {/* Right side: Notification + User */}
          <div className="flex items-center space-x-5 md:space-x-6">
            {/* Notification */}
            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="text-gray-700 hover:text-purple-600 relative"
                >
                  <BellDot size={24} />
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border z-50">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-semibold">Thông báo</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-medium">Học sinh mới đăng ký lớp Toán 10</p>
                        <p className="text-xs text-gray-500 mt-1">15 phút trước</p>
                      </div>
                      {/* Thêm các thông báo khác nếu cần */}
                    </div>
                    <div className="p-3 border-t text-center">
                      <Link to="/notifications" className="text-purple-600 hover:underline text-sm">
                        Xem tất cả
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={handleUserClick}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600"
              >
                {isLoggedIn ? (
                  user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="h-9 w-9 rounded-full object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-base border-2 border-purple-200"
                      style={{ backgroundColor: stringToColor(user?.full_name || user?.email || 'U') }}
                    >
                      {getInitials(user?.full_name || user?.email || 'U')}
                    </div>
                  )
                ) : (
                  <User size={26} />
                )}

                {isLoggedIn && (
                  <span className="text-sm hidden sm:inline font-medium">
                    {user?.full_name || 'Tài khoản'}
                  </span>
                )}

                {isLoggedIn && <ChevronDown size={14} className="hidden sm:block transition-transform" />}
              </button>

              {isLoggedIn && isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
                  <div className="py-2">
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <LayoutDashboard size={18} className="mr-3" /> Dashboard
                        </Link>
                        <Link
                          to="/admin/accounts"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Users size={18} className="mr-3" /> Danh sách tài khoản
                        </Link>
                        <Link
                          to="/profile"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <UserCircle size={18} className="mr-3" /> Hồ sơ cá nhân
                        </Link>
                      </>
                    )}

                    {isTutor && (
                      <>
                        <Link
                          to="/tutor/students"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Users size={18} className="mr-3" /> Quản lý học sinh
                        </Link>
                        <Link
                          to="/tutor/classes"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BookOpen size={18} className="mr-3" /> Quản lý lớp học
                        </Link>
                        <Link
                          to="/tutor/schedule"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Calendar size={18} className="mr-3" /> Lịch dạy
                        </Link>
                        <Link
                          to="/profile"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <UserCircle size={18} className="mr-3" /> Hồ sơ cá nhân
                        </Link>
                      </>
                    )}

                    {isStudent && (
                      <>
                        <Link
                          to="/student/courses"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BookOpen size={18} className="mr-3" /> Khóa học của tôi
                        </Link>
                        <Link
                          to="/student/schedule"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Calendar size={18} className="mr-3" /> Lịch học
                        </Link>
                        <Link
                          to="/profile"
                          className="flex px-4 py-3 hover:bg-purple-50 hover:text-purple-600"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <UserCircle size={18} className="mr-3" /> Hồ sơ cá nhân
                        </Link>
                      </>
                    )}

                    <hr className="my-1 border-gray-200" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full px-4 py-3 text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} className="mr-3" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {/* Search in mobile */}
              <form onSubmit={handleSearch} className="px-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </form>

              {/* Mobile nav links */}
              {isLoggedIn && isAdmin ? (
                <>
                  <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <LayoutDashboard size={18} className="mr-2" /> Dashboard
                  </Link>
                  <Link to="/admin/accounts" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <Users size={18} className="mr-2" /> Danh sách tài khoản
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <UserCircle size={18} className="mr-2" /> Hồ sơ cá nhân
                  </Link>
                </>
              ) : isLoggedIn && isTutor ? (
                <>
                  <Link to="/tutor/students" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <Users size={18} className="mr-2" /> Quản lý học sinh
                  </Link>
                  <Link to="/tutor/classes" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <BookOpen size={18} className="mr-2" /> Quản lý lớp học
                  </Link>
                  <Link to="/tutor/schedule" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <Calendar size={18} className="mr-2" /> Lịch dạy
                  </Link>
                  <Link to="/tutor/syllabus" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <BookOpen size={18} className="mr-2" /> Giáo trình
                  </Link>
                  <Link to="/tutor/ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <BookOpen size={18} className="mr-2" /> Trợ lý AI
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <UserCircle size={18} className="mr-2" /> Hồ sơ cá nhân
                  </Link>
                </>
              ) : isLoggedIn && isStudent ? (
                <>
                  <Link to="/student" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <Calendar size={18} className="mr-2" /> Thông tin học tập
                  </Link>
                  <Link to="/student/courses" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <BookOpen size={18} className="mr-2" /> Khóa học của tôi
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50 flex items-center">
                    <UserCircle size={18} className="mr-2" /> Hồ sơ cá nhân
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/introduction" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50">
                    Giới Thiệu
                  </Link>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-purple-50">
                    Liên Hệ
                  </Link>
                </>
              )}

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut size={18} className="mr-2" /> Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 text-purple-600 hover:bg-purple-50 font-medium"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Header;