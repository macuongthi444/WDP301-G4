// src/pages/Dashboard.jsx
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Chào mừng bạn đến Dashboard</h1>
        {user ? (
          <>
            <p className="text-lg mb-4">
              Xin chào, <strong>{user.full_name || user.email}</strong>!
            </p>
            <p className="mb-4">Vai trò: {user.roles?.join(', ') || 'Chưa có vai trò'}</p>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <p>Đang tải thông tin người dùng...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;