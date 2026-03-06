//src.pages/Tutor/Schedule/Schedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  // thêm
  const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
  //thêm
  const SUBJECT_OPTIONS = [
    "Toán",
    "Tiếng Việt",
    "Ngữ văn",
    "Tiếng Anh",
    "Khoa học",
    "Khoa học tự nhiên",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lý",
    "Lịch sử & Địa lý",
    "GDCD",
    "Giáo dục kinh tế & pháp luật",
    "Tin học",
    "Công nghệ",
    "Mỹ thuật",
    "Giáo dục thể chất",
    "Hoạt động trải nghiệm / Hướng nghiệp",
  ];
  const openSession = (schedule, date) => {
    const classId = getScheduleClassId(schedule);
    navigate(`/tutor/teaching/${classId}?date=${toYMD(date)}&scheduleId=${schedule._id}`);
  };
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
    grade: "--ChọnLớp--",             // ✅ thêm
    subject: "--ChọnMôn--",      // ✅ thêm
    mode: "OFFLINE",      // OFFLINE = Trực tiếp, ONLINE = Trực tuyến
    location: "",
    online_link: "",
    repeat_type: "WEEKLY", // WEEKLY | ONCE
    day_of_week: 1,
    start_time: "--:--",
    end_time: "--:--",
    location: "",
    online_link: "",
    note: "",
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
  const DOWS = [
    { value: 1, label: "Thứ hai" },
    { value: 2, label: "Thứ ba" },
    { value: 3, label: "Thứ tư" },
    { value: 4, label: "Thứ năm" },
    { value: 5, label: "Thứ sáu" },
    { value: 6, label: "Thứ bảy" },
    { value: 0, label: "Chủ nhật" },
  ];
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
  if (!newSchedule.start_date) return alert("Vui lòng chọn ngày bắt đầu");
  if (newSchedule.repeat_type === "WEEKLY" && !newSchedule.end_date) {
    return alert("Vui lòng chọn ngày kết thúc (Hằng tuần)");
  }

  const cls = classes.find((c) => c._id === newSchedule.classId);
  const classLevel = Number(cls?.level);
  const gradeToSend = Number.isFinite(classLevel) ? classLevel : Number(newSchedule.grade || 1);

  const payload = {
    grade: gradeToSend,
    subject: newSchedule.subject,

    repeat_type: newSchedule.repeat_type,
    day_of_week: Number(newSchedule.day_of_week),

    start_date: newSchedule.start_date,
    end_date: newSchedule.repeat_type === "ONCE" ? newSchedule.start_date : newSchedule.end_date,

    start_time: newSchedule.start_time,
    end_time: newSchedule.end_time,

    mode: newSchedule.mode,
    location: newSchedule.mode === "OFFLINE" ? newSchedule.location : "",
    online_link: newSchedule.mode === "ONLINE" ? newSchedule.online_link : "",

    note: newSchedule.note,
    is_active: !!newSchedule.is_active,
  };

  try {
    await api.post(`/class/${newSchedule.classId}/schedules`, payload);

    alert("Tạo lịch thành công!");
    setIsCreateModalOpen(false);

    setNewSchedule({
      classId: "",
      grade: "--ChọnLớp--",
      subject: "--ChọnMôn--",
      mode: "OFFLINE",
      location: "",
      online_link: "",
      repeat_type: "WEEKLY",
      day_of_week: 1,
      start_date: "",
      end_date: "",
      start_time: "--:--",
      end_time: "--:--",
      note: "",
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
                  className={`rounded-2xl p-4 min-h-[320px] cursor-pointer transition hover:brightness-[0.99] ${isToday ? "bg-sky-200/60" : "bg-slate-200"
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
                          <div
                            key={s._id}
                            className="rounded-xl bg-white p-3 shadow-md hover:bg-slate-50"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation(); // tránh trigger click cả ô ngày
                              openSession(s, day);
                            }}
                          >
                            <div className="text-sm font-extrabold text-slate-900">
                              {s.start_time || "--:--"} - {s.end_time || "--:--"}
                            </div>
                            <div className="mt-1 text-sm text-slate-900">{getClassNameById(classId)}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{getStudentNamesByClassId(classId)}</div>
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
                  <div
                    key={s._id}
                    className="rounded-xl bg-white p-3 shadow-md hover:bg-slate-50"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSession(s, currentDate); // ✅ đúng
                    }}
                  >
                    <div className="text-sm font-extrabold text-slate-900">
                      {s.start_time || "--:--"} - {s.end_time || "--:--"}
                    </div>
                    <div className="mt-1 text-sm text-slate-900">{getClassNameById(classId)}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{getStudentNamesByClassId(classId)}</div>
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
                className={`h-[90px] rounded-xl border text-left p-3 transition ${isToday
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
                className={`min-w-[84px] rounded-full px-5 py-2 text-sm font-semibold transition ${viewMode === it.key ? "bg-black text-white shadow" : "text-slate-700 hover:bg-white/70"
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
    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
      <button
        onClick={() => setIsCreateModalOpen(false)}
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <X size={20} />
      </button>

      <div className="px-6 pt-6 pb-3">
        <h2 className="text-2xl font-extrabold text-center text-slate-900">Tạo lịch dạy</h2>
      </div>

      <form onSubmit={handleCreateSchedule} className="px-6 pb-6 space-y-4">
        {/* Lớp (class) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Lớp:</label>
          <select
            value={newSchedule.classId}
            onChange={(e) => setNewSchedule({ ...newSchedule, classId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {/* Môn học */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Môn học:</label>
          <select
            value={newSchedule.subject}
            onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Hình thức dạy */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Hình thức dạy:</label>

          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={newSchedule.mode === "ONLINE"}
                onChange={() => setNewSchedule({ ...newSchedule, mode: "ONLINE" })}
              />
              Trực tuyến
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={newSchedule.mode === "OFFLINE"}
                onChange={() => setNewSchedule({ ...newSchedule, mode: "OFFLINE" })}
              />
              Trực tiếp
            </label>
          </div>

          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={newSchedule.mode === "ONLINE" ? "Link online" : "Địa chỉ"}
            value={newSchedule.mode === "ONLINE" ? newSchedule.online_link : newSchedule.location}
            onChange={(e) => {
              const v = e.target.value;
              setNewSchedule((prev) => ({
                ...prev,
                online_link: prev.mode === "ONLINE" ? v : prev.online_link,
                location: prev.mode === "OFFLINE" ? v : prev.location,
              }));
            }}
          />
        </div>

        {/* Lịch dạy */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Lịch dạy:</label>

          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="repeat"
                checked={newSchedule.repeat_type === "ONCE"}
                onChange={() =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    repeat_type: "ONCE",
                    end_date: prev.start_date,
                  }))
                }
              />
              Đơn buổi
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="repeat"
                checked={newSchedule.repeat_type === "WEEKLY"}
                onChange={() => setNewSchedule({ ...newSchedule, repeat_type: "WEEKLY" })}
              />
              Hằng tuần
            </label>
          </div>

          {/* Chọn thứ bằng nút */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DOWS.map((d) => {
              const active = Number(newSchedule.day_of_week) === Number(d.value);
              return (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setNewSchedule({ ...newSchedule, day_of_week: d.value })}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Chọn ngày */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              type="date"
              value={newSchedule.start_date}
              onChange={(e) =>
                setNewSchedule((prev) => ({
                  ...prev,
                  start_date: e.target.value,
                  end_date: prev.repeat_type === "ONCE" ? e.target.value : prev.end_date,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              disabled={newSchedule.repeat_type === "ONCE"}
              value={newSchedule.repeat_type === "ONCE" ? newSchedule.start_date : newSchedule.end_date}
              onChange={(e) => setNewSchedule({ ...newSchedule, end_date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
            />
          </div>

          {/* Chọn giờ */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              type="time"
              value={newSchedule.start_time}
              onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="time"
              value={newSchedule.end_time}
              onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú</label>
          <textarea
            rows={4}
            value={newSchedule.note}
            onChange={(e) => setNewSchedule({ ...newSchedule, note: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Tạo
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
                    <div
                      key={s._id}
                      className="rounded-xl bg-slate-50 p-4 hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        openSession(s, selectedDate);
                        setSelectedDate(null);
                      }}
                    >
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