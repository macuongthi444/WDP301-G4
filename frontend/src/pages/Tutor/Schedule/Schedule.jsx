import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import api from "../../../services/api";

const TutorSchedule = () => {
  const [viewMode, setViewMode] = useState("week"); // day | week | month
  const [currentDate, setCurrentDate] = useState(new Date());

  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    classId: "",
    day_of_week: 1,
    start_time: "18:00",
    end_time: "20:00",
    mode: "OFFLINE",
    location: "",
    online_link: "",
    is_active: true,
  });

  // Day detail modal
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSchedules();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/class");
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải lớp:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const classesRes = await api.get("/class");
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
      setError("Không thể tải lịch dạy");
    } finally {
      setLoading(false);
    }
  };

  // ---------- helpers ----------
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const parseDateOnly = (value) => {
    if (!value) return null;
    const t = new Date(value);
    if (Number.isNaN(t.getTime())) return null;
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  };

  const isDateInClassRange = (date, cls) => {
    // nếu backend không có start/end => coi như không giới hạn
    if (!cls) return true;
    const day = dateOnly(date);
    const start = parseDateOnly(cls.start_date);
    const end = parseDateOnly(cls.end_date);

    if (start && day < start) return false;
    if (end && day > end) return false;
    return true;
  };

  const startOfWeekMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0..6 (CN=0)
    const diff = day === 0 ? -6 : 1 - day; // về thứ 2
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const addDays = (date, delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  };

  const addMonths = (date, delta) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
  };

  const formatDDMMYYYY = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const viDayLong = (jsDay) => {
    const map = {
      1: "Thứ hai",
      2: "Thứ ba",
      3: "Thứ tư",
      4: "Thứ năm",
      5: "Thứ sáu",
      6: "Thứ bảy",
      0: "Chủ Nhật",
    };
    return map[jsDay] || "";
  };

  const getScheduleClassId = (s) => s?.class_id?._id || s?.class_id;

  const getClassById = (id) => classes.find((c) => c._id === id);

  const getClassNameById = (id) => getClassById(id)?.name || "Không xác định";

  const getStudentNamesByClassId = (classId) => {
    const cls = getClassById(classId);
    const arr = cls?.enrolled_students || [];
    const names = arr
      .map((x) => x?.student_user_id?.full_name || x?.full_name)
      .filter(Boolean);
    if (!names.length) return "-";
    const max = 2;
    return names.slice(0, max).join(", ") + (names.length > max ? `, +${names.length - max}` : "");
  };

  // ✅ FIX CHÍNH: lọc theo day_of_week + is_active + start/end của lớp
  const getSchedulesForDate = (date) => {
    const dow = date.getDay();

    return schedules
      .filter((s) => Number(s.day_of_week) === Number(dow))
      .filter((s) => s?.is_active !== false)
      .filter((s) => {
        const classId = getScheduleClassId(s);
        const cls = getClassById(classId);
        return isDateInClassRange(date, cls);
      });
  };

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(currentDate);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // ---------- navigation ----------
  const goPrev = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, -1));
    if (viewMode === "week") setCurrentDate((d) => addDays(d, -7));
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, -1));
  };

  const goNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
    if (viewMode === "week") setCurrentDate((d) => addDays(d, 7));
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const rangeLabel = useMemo(() => {
    if (viewMode === "day") return `Ngày ${formatDDMMYYYY(currentDate)}`;
    if (viewMode === "week")
      return `Tuần ${formatDDMMYYYY(weekDays[0])} - ${formatDDMMYYYY(weekDays[6])}`;
    return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  }, [viewMode, currentDate, weekDays]);

  // ---------- month grid ----------
  const getMonthGrid = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    const firstDow = first.getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1; // Monday start

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  // ---------- day detail modal ----------
  const openDayDetail = (date) => {
    const list = getSchedulesForDate(date)
      .slice()
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

    setSelectedDate(date);
    setSelectedDaySchedules(list);
  };

  // ---------- create schedule (backend giữ nguyên) ----------
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.classId) return alert("Vui lòng chọn lớp");

    try {
      await api.post(`/class/${newSchedule.classId}/schedules`, newSchedule);
      alert("Tạo lịch thành công!");
      setIsCreateModalOpen(false);
      setNewSchedule({
        classId: "",
        day_of_week: 1,
        start_time: "18:00",
        end_time: "20:00",
        mode: "OFFLINE",
        location: "",
        online_link: "",
        is_active: true,
      });
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || "Tạo lịch thất bại");
    }
  };

  // ---------- views ----------
  const WeekView = () => {
    const todayStr = new Date().toDateString();

    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day) => {
              const list = getSchedulesForDate(day)
                .slice()
                .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

              const isToday = day.toDateString() === todayStr;

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-2xl p-4 min-h-[320px] cursor-pointer transition hover:brightness-[0.99] ${
                    isToday ? "bg-sky-200/60" : "bg-slate-200"
                  }`}
                  onClick={() => openDayDetail(day)}
                  role="button"
                >
                  <div className="text-center font-extrabold text-slate-900">
                    {viDayLong(day.getDay())}
                  </div>

                  {list.length === 0 ? (
                    <p className="mt-4 text-center text-sm text-slate-700">Không có buổi dạy</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {list.map((s) => {
                        const classId = getScheduleClassId(s);
                        return (
                          <div key={s._id} className="rounded-xl bg-white p-3 shadow-md">
                            {/* ✅ Hiển thị giờ bắt đầu - kết thúc */}
                            <div className="text-sm font-extrabold text-slate-900">
                              {s.start_time || "--:--"} - {s.end_time || "--:--"}
                            </div>
                            <div className="mt-1 text-sm text-slate-900">
                              {getClassNameById(classId)}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {getStudentNamesByClassId(classId)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const DayView = () => {
    const list = getSchedulesForDate(currentDate)
      .slice()
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {list.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-10 text-center text-slate-600">
              Không có buổi dạy
            </div>
          ) : (
            <div className="space-y-6">
              {list.map((s) => {
                const classId = getScheduleClassId(s);
                return (
                  <div key={s._id} className="rounded-2xl bg-slate-50 px-6 py-5 shadow-sm">
                    {/* ✅ Hiển thị đủ start - end */}
                    <div className="text-base font-extrabold text-slate-900">
                      {s.start_time || "--:--"} - {s.end_time || "--:--"} •{" "}
                      {getClassNameById(classId)} • {getStudentNamesByClassId(classId)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {String(s?.mode).toUpperCase() === "OFFLINE"
                        ? s?.location
                          ? `Địa điểm: ${s.location}`
                          : "Học trực tiếp"
                        : s?.online_link
                        ? `Link: ${s.online_link}`
                        : "Học online"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const weekdays = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ Nhật"];
    const cells = getMonthGrid(currentDate);
    const todayStr = new Date().toDateString();
    const month = currentDate.getMonth();

    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((w) => (
            <div key={w} className="py-2 text-center text-sm font-bold text-slate-700">
              {w}
            </div>
          ))}

          {cells.map((d, idx) => {
            if (!d) return <div key={idx} className="h-[90px] rounded-xl bg-slate-50" />;

            const inMonth = d.getMonth() === month;
            const isToday = d.toDateString() === todayStr;

            // ✅ count cũng phải lọc theo start/end
            const count = getSchedulesForDate(d).length;

            return (
              <button
                key={d.toISOString()}
                onClick={() => openDayDetail(d)}
                className={`h-[90px] rounded-xl border text-left p-3 transition ${
                  isToday
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{d.getDate()}</div>
                  {count > 0 ? (
                    <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-slate-500">{count > 0 ? "Có buổi dạy" : "Trống"}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <CalendarIcon className="mt-1 h-7 w-7 text-slate-900" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Lịch dạy</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý buổi dạy của bạn và điểm danh</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:justify-end">
          {/* Nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50"
              aria-label="Trước"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>

            <div className="min-w-[240px] text-center text-sm font-semibold text-slate-900">
              {rangeLabel}
            </div>

            <button
              onClick={goNext}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50"
              aria-label="Sau"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>

            <button
              onClick={goToday}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Hôm nay
            </button>
          </div>

          {/* Segmented */}
          <div className="rounded-full bg-slate-100 p-1 flex items-center gap-1">
            {[
              { key: "day", label: "Ngày" },
              { key: "week", label: "Tuần" },
              { key: "month", label: "Tháng" },
            ].map((it) => (
              <button
                key={it.key}
                onClick={() => setViewMode(it.key)}
                className={`min-w-[84px] rounded-full px-5 py-2 text-sm font-semibold transition ${
                  viewMode === it.key ? "bg-black text-white shadow" : "text-slate-700 hover:bg-white/70"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>

          {/* Create */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-8 py-3 text-base font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90"
          >
            <span className="mr-2 font-bold">+</span>
            Tạo
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      ) : (
        <>
          {viewMode === "week" && <WeekView />}
          {viewMode === "day" && <DayView />}
          {viewMode === "month" && <MonthView />}
        </>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900">Tạo lịch dạy mới</h2>
            <p className="mt-1 text-sm text-slate-500">Điền thông tin để tạo lịch cho lớp</p>

            <form onSubmit={handleCreateSchedule} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Chọn lớp <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSchedule.classId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, classId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Thứ</label>
                  <select
                    value={newSchedule.day_of_week}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, day_of_week: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>Thứ hai</option>
                    <option value={2}>Thứ ba</option>
                    <option value={3}>Thứ tư</option>
                    <option value={4}>Thứ năm</option>
                    <option value={5}>Thứ sáu</option>
                    <option value={6}>Thứ bảy</option>
                    <option value={0}>Chủ Nhật</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Bắt đầu</label>
                  <input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kết thúc</label>
                  <input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hình thức</label>
                  <select
                    value={newSchedule.mode}
                    onChange={(e) => setNewSchedule({ ...newSchedule, mode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ONLINE">ONLINE</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-7">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={!!newSchedule.is_active}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                    Đang hoạt động
                  </label>
                </div>
              </div>

              {String(newSchedule.mode).toUpperCase() === "OFFLINE" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa điểm</label>
                  <input
                    type="text"
                    value={newSchedule.location}
                    onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                    placeholder="VD: Nhà học sinh / Trung tâm..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Online link</label>
                  <input
                    type="text"
                    value={newSchedule.online_link}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, online_link: e.target.value })
                    }
                    placeholder="VD: Zoom/Google Meet link..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
                >
                  Tạo lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                Lịch ngày {formatDDMMYYYY(selectedDate)}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDaySchedules.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-600">
                  Không có buổi dạy nào
                </div>
              ) : (
                selectedDaySchedules.map((s) => {
                  const classId = getScheduleClassId(s);
                  return (
                    <div key={s._id} className="rounded-xl bg-slate-50 p-4">
                      {/* ✅ Hiển thị start - end */}
                      <div className="font-extrabold text-slate-900">
                        {s.start_time || "--:--"} - {s.end_time || "--:--"}
                      </div>
                      <div className="text-sm text-slate-700">
                        Lớp: {getClassNameById(classId)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {String(s?.mode).toUpperCase() === "OFFLINE"
                          ? `Địa điểm: ${s.location || "Chưa cập nhật"}`
                          : `Link: ${s.online_link || "Chưa cập nhật"}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSchedule;