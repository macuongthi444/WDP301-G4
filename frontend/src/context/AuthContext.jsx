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
  const login = (userData) => {
    // userData từ backend: { id, email, full_name, roles: [...] }
    setUser(userData);
    setUserRoles(userData.roles || []);
    setIsLoggedIn(true);
    // Token đã được lưu trong LoginPage → interceptor sẽ tự dùng
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

export const register = async (fullName, email, password, phone) => {
  try {
    const response = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      phone: phone || undefined, // optional
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
  }
};