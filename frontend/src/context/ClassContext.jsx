// src/context/ClassContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ClassContext = createContext();

export function ClassProvider({ children }) {
  const [myClasses, setMyClasses] = useState([]);           // Danh sách tất cả lớp của tutor
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch tất cả lớp của tutor (chỉ gọi 1 lần khi mount)
  const fetchMyClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get('/class');
      setMyClasses(res.data.data || []);
    } catch (err) {
      toast.error('Không tải được danh sách lớp');
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []); // Chỉ chạy 1 lần

  const value = useMemo(
    () => ({
      myClasses,
      loadingClasses,
      fetchMyClasses,
      setMyClasses,
      // Không fetch currentClass ở đây nữa
      // Logic currentClass sẽ di chuyển vào ClassDetailLayout hoặc page con
    }),
    [myClasses, loadingClasses]
  );

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass phải dùng trong ClassProvider');
  }
  return context;
};