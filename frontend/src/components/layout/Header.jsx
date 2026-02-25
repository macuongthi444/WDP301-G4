// src/layouts/Header.jsx
import { useContext } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';

export default function Header({ onToggleSidebar }) {
  const { user } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Hamburger menu trên mobile */}
          <button className="md:hidden text-gray-600 focus:outline-none" onClick={onToggleSidebar}>
            <Bars3Icon className="w-7 h-7" />
          </button>

          {/* Phần giữa: có thể thêm breadcrumb hoặc tên lớp sau */}
          <div className="flex-1 px-4 md:px-0">
            {/* Ví dụ: <h2 className="text-lg font-semibold">Dashboard</h2> */}
          </div>

          {/* User info bên phải */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Tutor')}`}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
              <span className="font-medium text-gray-800">{user?.full_name || 'Tutor'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}