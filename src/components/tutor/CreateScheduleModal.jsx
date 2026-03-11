import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';

function CreateScheduleModal({ isOpen, onClose, userId }) {
  const [form, setForm] = useState({
    className: '',
    teachingMode: 'online',
    scheduleType: 'single',
    link: '',
    address: '',
    price: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    note: '',
  });
  // Per-day time slots for weekly mode: { T2: { startTime: '', endTime: '' }, ... }
  const [daySchedules, setDaySchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const classesRef = ref(db, `classes/${userId}`);
    const unsubscribe = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setClasses(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setClasses([]);
      }
    });
    return () => unsubscribe();
  }, [userId]);

  if (!isOpen) return null;

  const formatVND = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseVND = (val) => val.replace(/,/g, '');

  const handleChange = (field, value) => {
    if (field === 'price') {
      setForm((prev) => ({ ...prev, [field]: formatVND(value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const toggleDay = (dayKey) => {
    setDaySchedules(prev => {
      const updated = { ...prev };
      if (updated[dayKey]) {
        delete updated[dayKey];
      } else {
        updated[dayKey] = { startTime: '', endTime: '' };
      }
      return updated;
    });
  };

  const updateDayTime = (dayKey, field, value) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value }
    }));
  };

  // Find the selected class to auto-fill subject
  const selectedClass = classes.find(c => c.name === form.className);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.className) { alert('Vui lòng chọn lớp!'); return; }

    setLoading(true);
    try {
      const scheduleRef = ref(db, `schedules/${userId}`);

      if (form.scheduleType === 'weekly') {
        const selectedDayKeys = Object.keys(daySchedules);
        if (selectedDayKeys.length === 0) {
          alert('Vui lòng chọn ít nhất 1 ngày!');
          setLoading(false);
          return;
        }

        // Create a separate schedule entry for each day
        for (const dayKey of selectedDayKeys) {
          const dayData = daySchedules[dayKey];
          if (!dayData.startTime || !dayData.endTime) {
            alert(`Vui lòng nhập đầy đủ giờ cho ${weekDays.find(d => d.key === dayKey)?.label || dayKey}!`);
            setLoading(false);
            return;
          }

          const newRef = push(scheduleRef);
          await set(newRef, {
            className: form.className,
            subject: selectedClass?.subject || '',
            teachingMode: form.teachingMode,
            link: form.link || '',
            address: form.address || '',
            scheduleType: 'weekly',
            selectedDays: [dayKey],
            startTime: dayData.startTime,
            endTime: dayData.endTime,
            startDate: form.startDate || new Date().toISOString().split('T')[0],
            endDate: form.endDate || '',
            price: form.price ? parseInt(parseVND(form.price)) : 0,
            note: form.note,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Single schedule
        if (!form.startTime || !form.endTime) {
          alert('Vui lòng nhập giờ bắt đầu và kết thúc!');
          setLoading(false);
          return;
        }

        const newRef = push(scheduleRef);
        await set(newRef, {
          className: form.className,
          subject: selectedClass?.subject || '',
          teachingMode: form.teachingMode,
          link: form.link || '',
          address: form.address || '',
          scheduleType: 'single',
          startDate: form.startDate,
          startTime: form.startTime,
          endTime: form.endTime,
          price: form.price ? parseInt(parseVND(form.price)) : 0,
          note: form.note,
          createdAt: new Date().toISOString()
        });
      }

      onClose();
      setForm({
        className: '', teachingMode: 'online', scheduleType: 'single',
        link: '', address: '', price: '',
        startDate: '', endDate: '', startTime: '', endTime: '', note: '',
      });
      setDaySchedules({});
      alert('Tạo lịch dạy thành công!');
    } catch (error) {
      alert('Tạo lịch thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { key: 'T2', label: 'Thứ hai' },
    { key: 'T3', label: 'Thứ ba' },
    { key: 'T4', label: 'Thứ tư' },
    { key: 'T5', label: 'Thứ năm' },
    { key: 'T6', label: 'Thứ sáu' },
    { key: 'T7', label: 'Thứ bảy' },
    { key: 'CN', label: 'Chủ nhật' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden mx-4 z-10">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

          <div className="bg-white px-7 pt-7 pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-xl font-bold text-slate-900 text-center">Tạo lịch dạy</h2>
          </div>

          <div className="px-7 py-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

            {/* Lớp */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Lớp:</label>
              <select
                value={form.className}
                onChange={(e) => handleChange('className', e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">Chọn lớp học...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Hình thức dạy */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Hình thức dạy:</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="teachingMode" value="online" checked={form.teachingMode === 'online'} onChange={(e) => handleChange('teachingMode', e.target.value)} className="w-4 h-4 text-blue-500 accent-blue-500" />
                  <span className="text-sm text-slate-700">Trực tuyến</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="teachingMode" value="inperson" checked={form.teachingMode === 'inperson'} onChange={(e) => handleChange('teachingMode', e.target.value)} className="w-4 h-4 text-blue-500 accent-blue-500" />
                  <span className="text-sm text-slate-700">Trực tiếp</span>
                </label>
              </div>
            </div>

            {/* Link or Address */}
            {form.teachingMode === 'online' ? (
              <div>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => handleChange('link', e.target.value)}
                  placeholder="Link dạy"
                  className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Địa chỉ"
                  className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            )}

            {/* Lịch dạy */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Lịch dạy:</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scheduleType" value="single" checked={form.scheduleType === 'single'} onChange={(e) => handleChange('scheduleType', e.target.value)} className="w-4 h-4 accent-blue-500" />
                  <span className="text-sm text-slate-700">Đơn buổi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scheduleType" value="weekly" checked={form.scheduleType === 'weekly'} onChange={(e) => handleChange('scheduleType', e.target.value)} className="w-4 h-4 accent-blue-500" />
                  <span className="text-sm text-slate-700">Hàng tuần</span>
                </label>
              </div>
            </div>

            {/* Weekly: Day selectors with per-day time inputs */}
            {form.scheduleType === 'weekly' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                        daySchedules[d.key]
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Per-day time inputs */}
                {weekDays.filter(d => daySchedules[d.key]).map((d) => (
                  <div key={d.key} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-[13px] font-bold text-slate-700 w-20 shrink-0">{d.label}</span>
                    <input
                      type="time"
                      value={daySchedules[d.key]?.startTime || ''}
                      onChange={(e) => updateDayTime(d.key, 'startTime', e.target.value)}
                      onClick={(e) => e.target.showPicker?.()}
                      className="flex-1 border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-800 focus:border-blue-400 outline-none cursor-pointer"
                    />
                    <span className="text-slate-400 text-xs">→</span>
                    <input
                      type="time"
                      value={daySchedules[d.key]?.endTime || ''}
                      onChange={(e) => updateDayTime(d.key, 'endTime', e.target.value)}
                      onClick={(e) => e.target.showPicker?.()}
                      className="flex-1 border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-800 focus:border-blue-400 outline-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Date range */}
            <div className={`grid gap-3 ${form.scheduleType === 'single' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {form.scheduleType === 'single' ? 'Ngày dạy' : 'Ngày bắt đầu'}
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                />
              </div>
              {form.scheduleType === 'weekly' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Time range for single mode only */}
            {form.scheduleType === 'single' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Giá tiền */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Giá tiền (VNĐ/buổi):</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="VD: 100,000"
                  className="w-full border border-slate-300 rounded-lg py-2.5 pl-3 pr-12 text-sm text-slate-800 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">VNĐ</span>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ghi chú</label>
              <textarea
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-7 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Đang tạo...' : 'Tạo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateScheduleModal;
