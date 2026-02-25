// src/layouts/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    // { name: 'Lịch dạy', path: '/schedule' }, // thêm sau
    // { name: 'Thông báo', path: '/notifications' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Sidebar content */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">TutorClass</h1>
            <p className="text-sm text-gray-500">Quản lý lớp học kèm</p>
          </div>
          <button className="md:hidden" onClick={onClose}>
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg mb-1 text-gray-700 font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100'
                }`
              }
              onClick={onClose} // Đóng sidebar trên mobile
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Tutor')}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
            <div>
              <p className="font-medium">{user?.full_name || 'Tutor'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-left font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Overlay khi mở trên mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}