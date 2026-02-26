// src/components/TutorSidebar.jsx
import React from 'react';
import { NavLink ,useNavigate} from 'react-router-dom';
import { Users, BookOpen, Calendar, Sparkles, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TutorSidebar = () => {
  const { logout } = useAuth();
const navigate = useNavigate();
const handleLogout = () => {
    logout();
    navigate('/');   // hoặc '/login'
  };
  return (
    <div className="h-full flex flex-col">
      {/* Logo hoặc tên app */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-purple-600">Tutor Dashboard</h2>
      </div>

      {/* Menu links */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/tutor/students"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Users size={20} />
          Quản lý học sinh
        </NavLink>

        <NavLink
          to="/tutor/classes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <BookOpen size={20} />
          Quản lý lớp học
        </NavLink>

        <NavLink
          to="/tutor/schedule"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Calendar size={20} />
          Lịch dạy
        </NavLink>

        <NavLink
          to="/tutor/curriculum"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <BookOpen size={20} />
          Giáo trình
        </NavLink>

        <NavLink
          to="/tutor/ai-assistant"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Sparkles size={20} />
          Trợ lý AI
        </NavLink>

        <NavLink
          to="/tutor/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <UserCircle size={20} />
          Hồ sơ cá nhân
        </NavLink>
      </nav>

      {/* Đăng xuất */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}   // ← sửa thành hàm này
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default TutorSidebar;