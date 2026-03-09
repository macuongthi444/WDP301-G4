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
  Menu, Search, User, LogOut,
  Users, Calendar, BookOpen, UserCircle, BellDot,
  ChevronDown
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

  const notificationRef = useRef(null);

  const hasNotification = true; // → thay bằng logic thật sau
  const notificationCount = 3;

  const normalizeRole = (role) => String(role || '').toUpperCase();

  const isTutor = userRoles?.some(
    (role) =>
      normalizeRole(role).includes('TUTOR') ||
      normalizeRole(role) === 'ROLE_TUTOR'
  );

  const isStudent = userRoles?.some(
    (role) =>
      normalizeRole(role).includes('STUDENT') ||
      normalizeRole(role) === 'ROLE_STUDENT'
  );

  const isAdmin = userRoles?.some(
    (role) =>
      normalizeRole(role).includes('ADMIN') ||
      normalizeRole(role) === 'ROLE_ADMIN'
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

  const isTutor = userRoles?.some(role =>
    role.toUpperCase().includes('TUTOR') || role.toUpperCase() === 'ROLE_TUTOR'
  );

  const isStudent = userRoles?.some(role =>
    role.toUpperCase().includes('STUDENT') || role.toUpperCase() === 'ROLE_STUDENT'
  );

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
    let initials = '';
    if (words.length >= 2) {
      initials = (words[0][0] || '') + (words[words.length - 1][0] || '');
    } else {
      initials = trimmed.slice(0, 2);
    }
    return initials.toUpperCase();
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
            <img
              src={logo}
              alt="Tutor Note"
              className="h-14 sm:h-16 object-contain"
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-10 flex-1 justify-center">
            {isLoggedIn && isAdmin ? (
              <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center text-sm">
                <Link
                  to="/admin/dashboard"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link
                  to="/admin/accounts"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Users size={16} />
                  Danh sách tài khoản
                </Link>
              </div>
            ) : isLoggedIn && isTutor ? (
              <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center text-sm">
                <Link
                  to="/tutor/students"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Users size={16} />
                  Quản lý học sinh
                </Link>
                <Link
                  to="/tutor/classes"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen size={16} />
                  Quản lý lớp học
                </Link>
                <Link
                  to="/tutor/schedule"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Calendar size={16} />
                  Lịch dạy
                </Link>
                <Link
                  to="/tutor/curriculum"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen size={16} />
                  Giáo trình
                </Link>
                <Link
                  to="/tutor/ai-assistant"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen size={16} />
                  Trợ lý AI
                </Link>
              </div>
            ) : isLoggedIn && isStudent ? (
              <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center text-sm">
                <Link
                  to="/student"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Calendar size={16} />
                  Thông tin học tập
                </Link>
                <Link
                  to="/student"
                  className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen size={16} />
                  Giáo trình
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/introduction"
                  className="text-gray-800 hover:text-purple-600 font-medium"
                >
                  Giới Thiệu
                </Link>
                <Link
                  to="/products"
                  className="text-gray-800 hover:text-purple-600 font-medium"
                >
                  Sản phẩm
            {isLoggedIn && isTutor ? (
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/tutor/students/my" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Users size={16} /> Quản lý học sinh
                </Link>
                <Link to="/tutor/classes" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} /> Quản lý lớp học
                </Link>
                <Link to="/tutor/schedule" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar size={16} /> Lịch dạy
                </Link>

                
                {/* === DROPDOWN GIÁO TRÌNH CHO TUTOR – HOVER === */}
                <div className="relative group">
                  <div
                    className="flex items-center gap-1.5 text-gray-800 hover:text-purple-600 font-medium whitespace-nowrap cursor-pointer"
                  >
                    <BookOpen size={16} />
                    Giáo Trình
                    <ChevronDown
                      size={14}
                      className="transition-transform duration-200 group-hover:rotate-180"
                    />
                  </div>

                  {/* Dropdown content */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150">
                    {/* "Kéo dài" vùng hover bằng padding-top + pseudo element */}
                    <div className="relative pt-3">
                      {/* Pseudo element nối vùng hover (invisible bridge) */}
                      <div className="absolute -top-3 left-0 right-0 h-6 bg-transparent pointer-events-auto"></div>

                      <div className="py-2">
                        <Link
                          to="/tutor/syllabus"
                          className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          onClick={() => {/* optional: đóng menu nếu cần */ }}
                        >
                          <BookOpen size={18} className="mr-3 text-purple-500" />
                          Giáo trình
                        </Link>
                        <Link
                          to="/tutor/assignments"
                          className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <BookOpen size={18} className="mr-3 text-purple-500" />
                          Bài tập
                        </Link>
                        <Link
                          to="/tutor/submissions"
                          className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <BookOpen size={18} className="mr-3 text-purple-500" />
                          Bài nộp
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <Link to="/tutor/ai-assistant" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} /> Trợ lý AI
                </Link>
              </div>
            ) : isLoggedIn && isStudent ? (
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/student" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar size={16} /> Thông tin học tập
                </Link>
                <Link to="/student/courses" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} /> Khóa học của tôi
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-8 text-sm">
                <Link to="/introduction" className="text-gray-800 hover:text-purple-600 font-medium">
                  Giới Thiệu
                </Link>
                <Link to="/" className="text-gray-800 hover:text-purple-600 font-medium">
                  Liên Hệ
                </Link>
              </div>
            )}
          </div>

          {!isAdmin && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
                >
                  <Search size={22} />
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center space-x-6">
            {!isAdmin && (
              <button className="md:hidden text-gray-700 hover:text-purple-600">
                <Search size={24} />
              </button>
            )}

            <button
              onClick={handleUserClick}
              className="text-gray-700 hover:text-purple-600 flex items-center gap-2"
              aria-label="Tài khoản"
            >
              {isLoggedIn && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-purple-300"
                />
              ) : (
                <User size={26} />
              )}
              {isLoggedIn && (
                <span className="text-sm hidden sm:inline">
                  {user?.full_name || 'Tài khoản'}
                </span>
              )}
            </button>
          </div>
        </div>

        {isUserDropdownOpen && isLoggedIn && (
          <div
            ref={userDropdownRef}
            className="absolute right-4 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="py-2">
              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <LayoutDashboard size={18} className="mr-3" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/accounts"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Users size={18} className="mr-3" />
                    Danh sách tài khoản
                  </Link>
                </>
              )}

              {isTutor && (
                <>
                  <Link
                    to="/tutor/students"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Users size={18} className="mr-3" />
                    Quản lý học sinh
                  </Link>
                  <Link
                    to="/tutor/classes"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <BookOpen size={18} className="mr-3" />
                    Quản lý lớp học
                  </Link>
                  <Link
                    to="/tutor/schedule"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Calendar size={18} className="mr-3" />
                    Lịch dạy
                  </Link>
                  <Link
                    to="/tutor/profile"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <UserCircle size={18} className="mr-3" />
                    Hồ sơ cá nhân
                  </Link>
                </>
              )}

              {isStudent && (
                <>
                  <Link
                    to="/student"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Calendar size={18} className="mr-3" />
                    Thông tin học tập
                  </Link>
                  <Link
                    to="/student"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <BookOpen size={18} className="mr-3" />
                    Giáo trình
                  </Link>
                </>
              )}

              <hr className="my-1 border-gray-200" />

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50"
          {/* Icons section (giữ nguyên, user dropdown hover) */}
          <div className="flex items-center space-x-6">
            {/* Notification */}
            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(prev => !prev)}
                  className="text-gray-700 hover:text-purple-600 relative"
                  aria-label="Thông báo"
                >
                  <BellDot size={24} />
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Thông báo</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-medium">Học sinh mới đăng ký lớp Toán 10</p>
                        <p className="text-xs text-gray-500 mt-1">15 phút trước</p>
                      </div>
                      {/* ... các thông báo khác */}
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

            {/* User Dropdown - hover */}
            
            <div className="relative group">
              <div
                className="text-gray-700 hover:text-purple-600 flex items-center gap-2 cursor-pointer"
                onClick={() => {
      if (!isLoggedIn) {
        navigate('/login');
      }
      // Nếu đã login thì để hover dropdown như cũ
    }}
              >
                {isLoggedIn ? (
                  user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="h-9 w-9 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-sm border-2 border-purple-200"
                      style={{ backgroundColor: stringToColor(user?.full_name || user?.email || 'User') }}
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

                {/* Mũi tên nhỏ để biết có dropdown (tùy chọn, có thể bỏ nếu không thích) */}
                {isLoggedIn && (
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-180 hidden sm:block"
                  />
                )}
              </div>

              {/* Dropdown content – fix hover gap */}
              {isLoggedIn && (
                <div
                  className={`
        absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 
        z-[60] overflow-hidden opacity-0 group-hover:opacity-100 
        pointer-events-none group-hover:pointer-events-auto 
        transition-opacity duration-150
      `}
                >
                  {/* Cầu nối vô hình để hover không bị ngắt */}
                  <div className="absolute -top-3 right-0 left-0 h-6 bg-transparent pointer-events-auto"></div>

                  <div className="py-2">
                    {isTutor && (
                      <>
                        <Link
                          to="/tutor/students"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Users size={18} className="mr-3" />
                          Quản lý học sinh
                        </Link>
                        <Link
                          to="/tutor/classes"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <BookOpen size={18} className="mr-3" />
                          Quản lý lớp học
                        </Link>
                        <Link
                          to="/tutor/schedule"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Calendar size={18} className="mr-3" />
                          Lịch dạy
                        </Link>
                        <Link
                          to="/tutor/profile"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <UserCircle size={18} className="mr-3" />
                          Hồ sơ cá nhân
                        </Link>
                      </>
                    )}

                    {isStudent && (
                      <>
                        <Link
                          to="/student/courses"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <BookOpen size={18} className="mr-3" />
                          Khóa học của tôi
                        </Link>
                        <Link
                          to="/student/schedule"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Calendar size={18} className="mr-3" />
                          Lịch học
                        </Link>
                      </>
                    )}

                    <hr className="my-1 border-gray-200" />

                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} className="mr-3" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {!isAdmin && (
                <form onSubmit={handleSearch} className="px-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <Search
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                  </div>
                </form>
              )}

              {isLoggedIn && isAdmin ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <LayoutDashboard size={18} className="mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/accounts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <Users size={18} className="mr-2" />
                    Danh sách tài khoản
                  </Link>
                </>
              ) : isLoggedIn && isTutor ? (
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

              {isLoggedIn && isTutor ? (
                <>
                  <Link to="/tutor/students" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <Users size={18} className="mr-2" /> Quản lý học sinh
                  </Link>
                  <Link to="/tutor/classes" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Quản lý lớp học
                  </Link>
                  <Link to="/tutor/schedule" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <Calendar size={18} className="mr-2" /> Lịch dạy
                  </Link>

                  {/* 3 link Giáo Trình cho tutor trên mobile */}
                  <Link to="/tutor/syllabus" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Giáo trình
                  </Link>
                  <Link to="/tutor/exercises" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Bài tập
                  </Link>
                  <Link to="/tutor/submissions" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Bài nộp
                  </Link>

                  <Link to="/tutor/ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Trợ lý AI
                  </Link>
                </>
              ) : isLoggedIn && isStudent ? (
                <>
                  <Link to="/student" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <Calendar size={18} className="mr-2" /> Thông tin học tập
                  </Link>
                  <Link to="/student/courses" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center">
                    <BookOpen size={18} className="mr-2" /> Khóa học của tôi
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/introduction" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg">
                    Giới Thiệu
                  </Link>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg">
                    Liên Hệ
                  </Link>
                </>
              )}

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/'); }}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-left flex items-center"
                >
                  <LogOut size={18} className="mr-2" /> Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-lg text-left font-medium"
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