// src/pages/Tutor/TutorSchedule.jsx
import React, { useState, useEffect } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, X, Loader2, Calendar as CalendarIcon
} from 'lucide-react';
import api from '../../../services/api';

const TutorSchedule = () => {
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal tạo lịch
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    classId: '',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '20:00',
    mode: 'OFFLINE',
    location: '',
    online_link: '',
    is_active: true,
  });

  // Modal chi tiết ngày
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSchedules();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/class');
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải lớp:', err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const classesRes = await api.get('/class');
      const myClasses = classesRes.data.data || [];

      const allSchedules = [];
      for (const cls of myClasses) {
        try {
          const schedRes = await api.get(`/class/${cls._id}/schedules`);
          allSchedules.push(...(schedRes.data.data || []));
        } catch (err) {
          console.warn(`Không lấy được lịch lớp ${cls._id}:`, err);
        }
      }

      setSchedules(allSchedules);
    } catch (err) {
      setError('Không thể tải lịch dạy');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Lấy tất cả ngày trong tháng
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  // Helper: Lấy lịch của một ngày cụ thể
  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const targetDayOfWeek = date.getDay(); // 0=CN, 1=T2,...
    return schedules.filter(s => s.day_of_week === targetDayOfWeek);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.classId) return alert('Vui lòng chọn lớp');

    try {
      await api.post(`/class/${newSchedule.classId}/schedules`, newSchedule);
      alert('Tạo lịch thành công!');
      setIsCreateModalOpen(false);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo lịch thất bại');
    }
  };

  const openDayDetail = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const daySchedules = getSchedulesForDate(date);
    setSelectedDaySchedules(daySchedules);
  };

  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // ────────────────────────────────────────────────
  // Render functions (đặt trước return)
  // ────────────────────────────────────────────────

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <h1 className="text-3xl font-bold text-purple-700">Lịch dạy của tôi</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-gray-100 rounded-full p-1 flex">
          {['day', 'week', 'month'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                viewMode === mode ? 'bg-purple-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          <Plus size={18} /> Tạo lịch học
        </button>
      </div>
    </div>
  );

  const renderNavigation = () => {
    if (viewMode === 'day') {
      return (
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <button onClick={() => {
            const prev = new Date(currentDate);
            prev.setDate(prev.getDate() - 1);
            setCurrentDate(prev);
          }} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => {
            const next = new Date(currentDate);
            next.setDate(next.getDate() + 1);
            setCurrentDate(next);
          }} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={24} />
          </button>
        </div>
      );
    }

    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return (
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            Tuần từ {start.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} 
            - {end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h2>
          <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={24} />
          </button>
        </div>
      );
    }

    if (viewMode === 'month') {
      return (
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={24} />
          </button>
        </div>
      );
    }
    return null;
  };

  const renderDayView = () => {
    const daySchedules = getSchedulesForDate(currentDate);
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon size={20} /> Buổi dạy ngày hôm nay
        </h3>
        {daySchedules.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Không có buổi dạy nào hôm nay</p>
        ) : (
          <div className="space-y-4">
            {daySchedules.map(s => (
              <div key={s._id} className="border-l-4 border-purple-600 pl-4 py-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{s.start_time} - {s.end_time}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Lớp: {classes.find(c => c._id === s.class_id)?.name || 'Không xác định'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.mode === 'OFFLINE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {s.mode}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {s.mode === 'OFFLINE' ? `Địa điểm: ${s.location || 'Chưa cập nhật'}` : `Link: ${s.online_link || 'Chưa cập nhật'}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = Array(7).fill().map((_, i) => {
      const day = new Date(currentDate);
      day.setDate(currentDate.getDate() - currentDate.getDay() + 1 + i);
      return day;
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const daySchedules = getSchedulesForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 min-h-[160px] hover:bg-gray-50 cursor-pointer transition ${
                isToday ? 'border-purple-500 bg-purple-50' : ''
              }`}
              onClick={() => openDayDetail(day)}
            >
              <div className="text-center mb-2">
                <p className={`font-medium ${isToday ? 'text-purple-700' : ''}`}>
                  {day.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })}
                </p>
                {daySchedules.length > 0 && (
                  <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded-full mt-1">
                    {daySchedules.length} buổi
                  </span>
                )}
              </div>

              {daySchedules.map(s => (
                <div key={s._id} className="bg-purple-50 p-2 rounded mb-2 text-xs">
                  <p className="font-medium">{s.start_time} - {s.end_time}</p>
                  <p className="truncate">{classes.find(c => c._id === s.class_id)?.name}</p>
                </div>
              ))}

              {daySchedules.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">Trống</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-100 text-center py-3 font-medium text-gray-700">
          {weekdays.map((day, i) => <div key={i}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            if (!day) return <div key={index} className="bg-white min-h-[100px]" />;

            const daySchedules = getSchedulesForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`p-2 min-h-[100px] flex flex-col bg-white hover:bg-gray-50 cursor-pointer transition ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${isToday ? 'bg-purple-50 border-purple-300' : ''}`}
                onClick={() => openDayDetail(day)}
              >
                <p className={`text-right font-medium ${isToday ? 'text-purple-700' : ''}`}>
                  {day.getDate()}
                </p>

                {daySchedules.length > 0 && (
                  <div className="mt-1 text-center">
                    <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {daySchedules.length}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {renderHeader()}
      {renderNavigation()}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-10">{error}</div>
      ) : (
        <>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </>
      )}

      {/* Modal Tạo lịch */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <X size={28} />
            </button>

            <h2 className="text-2xl font-bold text-purple-700 mb-6">Tạo lịch dạy mới</h2>

            <form onSubmit={handleCreateSchedule} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn lớp <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSchedule.classId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, classId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  required
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Các field còn lại giữ nguyên như code cũ */}
              {/* ... (copy phần còn lại của form từ code bạn có) ... */}

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tạo lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chi tiết ngày */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Lịch ngày {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <button onClick={() => setSelectedDate(null)}>
                <X size={24} />
              </button>
            </div>

            {selectedDaySchedules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Không có buổi dạy nào trong ngày này</p>
            ) : (
              <div className="space-y-4">
                {selectedDaySchedules.map(s => (
                  <div key={s._id} className="border-l-4 border-purple-600 pl-4 py-2 bg-gray-50 rounded">
                    <p className="font-medium text-lg">{s.start_time} - {s.end_time}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Lớp: {classes.find(c => c._id === s.class_id)?.name || 'Không xác định'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.mode === 'OFFLINE' ? `Địa điểm: ${s.location || 'Chưa cập nhật'}` : `Link: ${s.online_link || 'Chưa cập nhật'}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSchedule;