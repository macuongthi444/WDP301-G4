// src/pages/Tutor/TutorSchedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import api from "../../../services/api";

const TutorSchedule = () => {
  const [viewMode, setViewMode] = useState("week"); // 'day' | 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal tạo lịch
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

  // Helpers
  const viDayNameLong = (jsDay) => {
    // jsDay: 0=CN .. 6=T7
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

  const formatDDMMYYYY = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const startOfWeekMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0..6
    const diff = day === 0 ? -6 : 1 - day; // Monday as start
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Lấy lịch của một ngày cụ thể
  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const targetDayOfWeek = date.getDay(); // 0=CN, 1=T2,...
    // giữ nguyên backend mapping day_of_week
    return schedules.filter((s) => s.day_of_week === targetDayOfWeek);
  };

  const classNameById = (id) => classes.find((c) => c._id === id)?.name || "Không xác định";

  // Status pill (nếu backend có status/attendance thì hiển thị đúng; nếu không thì fallback)
  const getUiStatus = (s) => {
    const raw =
      s.status ||
      s.attendance_status ||
      s.attendanceStatus ||
      s.state ||
      (s.is_active === false ? "INACTIVE" : "");

    const v = String(raw || "").toUpperCase();

    if (["DONE", "ATTENDED", "CHECKED", "CHECKED_IN", "COMPLETED"].includes(v)) {
      return { text: "Đã điểm danh", cls: "bg-emerald-100 text-emerald-700" };
    }
    if (["ABSENT", "MISSED"].includes(v)) {
      return { text: "Vắng", cls: "bg-yellow-100 text-yellow-700" };
    }
    if (["INACTIVE", "DISABLED", "CANCELLED"].includes(v)) {
      return { text: "Tạm dừng", cls: "bg-slate-200 text-slate-700" };
    }
    return { text: "Chưa bắt đầu", cls: "bg-slate-200 text-slate-700" };
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.classId) return alert("Vui lòng chọn lớp");

    try {
      await api.post(`/class/${newSchedule.classId}/schedules`, newSchedule);
      alert("Tạo lịch thành công!");
      setIsCreateModalOpen(false);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || "Tạo lịch thất bại");
    }
  };

  // Month view helpers (giữ logic, chỉ đổi UI)
  const getDaysInMonthGrid = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // monday-based index: T2=0..CN=6
    const firstDow = first.getDay(); // 0..6
    const offset = firstDow === 0 ? 6 : firstDow - 1;

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }

    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  };

  // ───────────────── UI ─────────────────
  const Title = () => (
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <CalendarIcon className="h-7 w-7 text-slate-900" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Lịch dạy{" "}
          {viewMode === "day" ? (
            <span className="font-semibold text-slate-900">
              Ngày {formatDDMMYYYY(currentDate)}
            </span>
          ) : null}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý buổi dạy của bạn và điểm danh</p>
      </div>
    </div>
  );

  const Segmented = () => (
    <div className="rounded-full bg-slate-100 p-1 flex items-center gap-1">
      {[
        { key: "day", label: "ngày" },
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
  );

  const CreateBtn = () => (
    <button
      onClick={() => setIsCreateModalOpen(true)}
      className="rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-8 py-3 text-base font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90"
    >
      <span className="mr-2 font-bold">+</span>
      Tạo
    </button>
  );

  const ShellCard = ({ children }) => (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      {children}
    </div>
  );

  const WeekView = () => {
    const todayStr = new Date().toDateString();

    return (
      <ShellCard>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const daySchedules = getSchedulesForDate(day);
            const isToday = day.toDateString() === todayStr;

            return (
              <div
                key={day.toISOString()}
                className={`rounded-2xl p-4 min-h-[320px] ${
                  isToday ? "bg-sky-200/60" : "bg-slate-200"
                }`}
              >
                <div className="text-center font-extrabold text-slate-900">{viDayNameLong(day.getDay())}</div>

                {daySchedules.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-slate-700">Không có buổi dạy</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {daySchedules
                      .slice()
                      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
                      .map((s) => {
                        const st = getUiStatus(s);
                        return (
                          <div
                            key={s._id}
                            className="rounded-xl bg-white p-3 shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-sm font-extrabold text-slate-900">
                                {s.start_time || "--:--"}
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                                {st.text}
                              </span>
                            </div>

                            <div className="mt-1 text-sm text-slate-900">
                              {classNameById(s.class_id)}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-600">
                              {s.mode === "OFFLINE"
                                ? s.location
                                  ? `Địa điểm: ${s.location}`
                                  : "Học trực tiếp"
                                : s.online_link
                                ? "Online (có link)"
                                : "Học online"}
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
      </ShellCard>
    );
  };

  const DayView = () => {
    const daySchedules = getSchedulesForDate(currentDate).slice().sort((a, b) =>
      String(a.start_time).localeCompare(String(b.start_time))
    );

    return (
      <ShellCard>
        <div className="space-y-6">
          {daySchedules.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-10 text-center text-slate-600">
              Không có buổi dạy
            </div>
          ) : (
            daySchedules.map((s) => {
              const st = getUiStatus(s);
              return (
                <div
                  key={s._id}
                  className="rounded-xl bg-white px-6 py-5 shadow-md"
                >
                  <div className="text-base font-extrabold text-slate-900">
                    {s.start_time || "--:--"} - {classNameById(s.class_id)}
                  </div>

                  <div className="mt-1 text-sm">
                    <span className={`font-semibold ${st.cls.includes("emerald") ? "text-emerald-600" : st.cls.includes("yellow") ? "text-yellow-600" : "text-slate-400"}`}>
                      {st.text}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {s.mode === "OFFLINE"
                      ? s.location
                        ? `Địa điểm: ${s.location}`
                        : "Học trực tiếp"
                      : s.online_link
                      ? `Link: ${s.online_link}`
                      : "Học online"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ShellCard>
    );
  };

  const MonthView = () => {
    const cells = getDaysInMonthGrid(currentDate);
    const weekdays = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ Nhật"];

    const todayStr = new Date().toDateString();
    const month = currentDate.getMonth();

    return (
      <ShellCard>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((w) => (
            <div key={w} className="py-2 text-center text-sm font-bold text-slate-700">
              {w}
            </div>
          ))}

          {cells.map((d, idx) => {
            if (!d) {
              return <div key={idx} className="h-[90px] rounded-xl bg-slate-50" />;
            }

            const inMonth = d.getMonth() === month;
            const isToday = d.toDateString() === todayStr;
            const count = getSchedulesForDate(d).length;

            return (
              <button
                key={d.toISOString()}
                onClick={() => {
                  setCurrentDate(d);
                  setViewMode("day");
                }}
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
                <div className="mt-2 text-xs text-slate-500">
                  {count > 0 ? "Có buổi dạy" : "Trống"}
                </div>
              </button>
            );
          })}
        </div>
      </ShellCard>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header area (theo ảnh, bỏ qua header site) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <Title />
        <div className="flex flex-wrap items-center gap-4 md:justify-end">
          <Segmented />
          <CreateBtn />
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

      {/* Modal Tạo lịch (UI đẹp, backend giữ nguyên) */}
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
              {/* Lớp */}
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

              {/* Row: ngày + giờ */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
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

                <div className="md:col-span-1">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kết thúc</label>
                  <input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Mode */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Hình thức
                  </label>
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
                    onChange={(e) => setNewSchedule({ ...newSchedule, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                    Đang hoạt động
                  </label>
                </div>
              </div>

              {/* Location / link */}
              {newSchedule.mode === "OFFLINE" ? (
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
                    onChange={(e) => setNewSchedule({ ...newSchedule, online_link: e.target.value })}
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
    </div>
  );
};

export default TutorSchedule;