import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, User, ShoppingCart, LogOut, Users, Calendar, BookOpen, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/logo.png';
import headerBg from '../assets/header-background.png';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRoles, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Đóng dropdown khi click ngoài (chỉ dùng khi đã login)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  // Kiểm tra là tutor
  const isTutor = userRoles?.some(role =>
    role.toUpperCase().includes('TUTOR') ||
    role.toUpperCase() === 'ROLE_TUTOR'
  );

  // Xử lý click icon User
  const handleUserClick = () => {
    if (isLoggedIn && isTutor) {
      setIsUserDropdownOpen(!isUserDropdownOpen); // Mở dropdown nếu tutor
    } else {
      navigate('/login'); // Chuyển thẳng đến login nếu chưa đăng nhập
    }
  };

  return (
    <div
      className="bg-cover bg-center bg-no-repeat relative shadow-sm"
      style={{ backgroundImage: `url(${headerBg})`, minHeight: '100px' }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-purple-600"
            aria-label="Toggle menu"
          >
            <Menu size={28} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Tutor Note" className="h-14 sm:h-16 object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10 flex-1 justify-center">
            {isLoggedIn && isTutor ? (
              <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center text-sm">
                <Link to="/tutor/students" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Users size={16} />
                  Quản lý học sinh
                </Link>
                <Link to="/tutor/classes" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} />
                  Quản lý lớp học
                </Link>
                <Link to="/tutor/schedule" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar size={16} />
                  Lịch dạy
                </Link>
                <Link to="/tutor/curriculum" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} />
                  Giáo trình
                </Link>
                <Link to="/tutor/ai-assistant" className="text-gray-800 hover:text-purple-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen size={16} />
                  Trợ lý AI
                </Link>
              </div>
            ) : (
              <>
                <Link to="/introduction" className="text-gray-800 hover:text-purple-600 font-medium">
                  Giới Thiệu
                </Link>
                <Link to="/products" className="text-gray-800 hover:text-purple-600 font-medium">
                  Sản phẩm
                </Link>
              </>
            )}
          </div>

          {/* Search Bar (desktop) */}
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

          {/* Icons */}
          <div className="flex items-center space-x-6">
            {/* Search mobile */}
            <button className="md:hidden text-gray-700 hover:text-purple-600">
              <Search size={24} />
            </button>

            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              className="text-gray-700 hover:text-purple-600 relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart size={26} />
            </button>

            {/* User Icon */}
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
              {isLoggedIn && <span className="text-sm hidden sm:inline">{user?.full_name || 'Tài khoản'}</span>}
            </button>
          </div>
        </div>

        {/* Dropdown chỉ hiện khi tutor đã login */}
        {isUserDropdownOpen && isLoggedIn && isTutor && (
          <div ref={userDropdownRef} className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="py-2">
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
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => {
                  logout();
                  setIsUserDropdownOpen(false);
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="px-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </form>

              {/* Nav items */}
              {isLoggedIn && isTutor ? (
                <>
                  <Link
                    to="/tutor/students"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <Users size={18} className="mr-2" />
                    Quản lý học sinh
                  </Link>
                  <Link
                    to="/tutor/classes"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <BookOpen size={18} className="mr-2" />
                    Quản lý lớp học
                  </Link>
                  <Link
                    to="/tutor/schedule"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <Calendar size={18} className="mr-2" />
                    Lịch dạy
                  </Link>
                  <Link
                    to="/tutor/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center"
                  >
                    <UserCircle size={18} className="mr-2" />
                    Hồ sơ cá nhân
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/introduction"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                  >
                    Giới Thiệu
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                  >
                    Sản phẩm
                  </Link>
                </>
              )}

              {/* Mobile User Actions */}
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-left flex items-center"
                >
                  <LogOut size={18} className="mr-2" />
                  Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
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