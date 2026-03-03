import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Import axios instance của bạn

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true); // Để tránh flash khi load

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Gọi API để lấy thông tin user hiện tại (nếu backend có endpoint /auth/me hoặc /users/me)
        // Nếu backend không có → bạn có thể decode token JWT ở frontend (dùng jwt-decode)
        // Nhưng khuyến nghị dùng API để lấy info mới nhất
        const response = await api.get('/auth/me'); // Thay endpoint nếu backend có khác (ví dụ /users/profile)

        const userData = response.data.user || response.data;
        setUser(userData);
        setUserRoles(userData.roles || []);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Hàm login - được gọi từ LoginPage sau khi API login thành công
  // src/context/AuthContext.jsx (hoặc ./contexts/AuthContext.jsx)
const login = (token, userData) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  setUser(userData);
  setUserRoles(userData.roles || []);
  setIsLoggedIn(true);
};

  // Hàm logout
  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setUserRoles([]);
    // Có thể redirect về /login nếu cần
  };

  // Giá trị context cung cấp
  const value = {
    isLoggedIn,
    user,
    userRoles,
    loading,
    login,
    logout,
    hasRole: (role) => {                          // ← THÊM ĐOẠN NÀY
    if (!userRoles || userRoles.length === 0) return false;
    const upperRole = role.toUpperCase();
    return userRoles.some(r => 
      String(r).toUpperCase() === upperRole ||
      String(r).toUpperCase() === `ROLE_${upperRole}`
    );
  },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Chỉ render app khi auth check xong */}
    </AuthContext.Provider>
  );
};

// Hook tiện lợi để dùng context ở bất kỳ component nào
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
