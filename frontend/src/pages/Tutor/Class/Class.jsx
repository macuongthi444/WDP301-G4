// src/pages/Tutor/TutorClasses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const TutorClasses = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/filter FE
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  // ✅ GIỮ modal tạo lớp => phải có 2 state này
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    level: "",
    default_mode: "OFFLINE",
    default_location: "",
    default_online_link: "",
    start_date: "",
    end_date: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/class");
      setClasses(res.data.data || []);
    } catch (err) {
      setError("Không thể tải danh sách lớp học");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const isActiveClass = (cls) => cls?.is_active !== false;

  const modeLabel = (m) =>
    String(m || "").toUpperCase() === "ONLINE" ? "Trực tuyến" : "Trực tiếp";

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(isActiveClass).length;
    const inactive = total - active;
    const unfinished = 0;
    return { total, active, inactive, unfinished };
  }, [classes]);

  const visibleClasses = useMemo(() => {
    const q = query.trim().toLowerCase();

    return classes
      .filter((c) => {
        if (statusFilter === "ACTIVE") return isActiveClass(c);
        if (statusFilter === "INACTIVE") return !isActiveClass(c);
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        const hay = [c?.name || "", c?.level || "", String(c?.default_mode || "")]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [classes, query, statusFilter]);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.name) return alert("Tên lớp là bắt buộc");
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.post("/class", newClass);
      setClasses((prev) => [...prev, res.data.data]);
      alert("Tạo lớp thành công!");
      setIsAddClassModalOpen(false);
      setNewClass({
        name: "",
        level: "",
        default_mode: "OFFLINE",
        default_location: "",
        default_online_link: "",
        start_date: "",
        end_date: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Tạo lớp thất bại");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Title + Add */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-7 w-7 text-slate-900" />
          <h1 className="text-3xl font-extrabold text-slate-900">Quản lý lớp học</h1>
        </div>

        <button
          onClick={() => setIsAddClassModalOpen(true)}
          className="w-fit rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-8 py-3 text-base font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90"
        >
          Thêm lớp học
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {[
          { label: "Tổng số", value: stats.total },
          { label: "Hoạt động", value: stats.active },
          { label: "Không hoạt động", value: stats.inactive },
          { label: "Chưa hoàn thành bài tập", value: stats.unfinished },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-slate-100 px-6 py-5 text-slate-700">
            <div className="text-sm">{s.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm lớp học..."
          className="w-full md:max-w-[380px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Tất cả</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-4 bg-slate-100 px-6 py-4 text-base font-extrabold text-slate-800">
          <div className="col-span-4">Lớp</div>
          <div className="col-span-2">Cấp độ</div>
          <div className="col-span-3">Hình thức</div>
          <div className="col-span-3">Trạng thái</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
          </div>
        ) : visibleClasses.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Chưa có lớp học nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleClasses.map((cls) => {
              const active = isActiveClass(cls);
              return (
                <button
                  key={cls._id}
                  onClick={() => navigate(`/tutor/classes/${cls._id}`)} // ✅ CHUYỂN SANG ClassDetail
                  className="grid w-full grid-cols-12 gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <div className="col-span-4 text-sm font-semibold text-slate-900">{cls.name}</div>
                  <div className="col-span-2 text-sm font-semibold text-slate-900">{cls.level || "-"}</div>
                  <div className="col-span-3 text-sm text-slate-700">{modeLabel(cls.default_mode)}</div>
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {active ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm lớp */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsAddClassModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900">Thêm lớp học</h2>
            <p className="mt-1 text-sm text-slate-500">Điền thông tin để tạo lớp mới</p>

            <form onSubmit={handleAddClass} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tên lớp <span className="text-red-500">*</span>
                </label>
                <input
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: Toán 06"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cấp độ</label>
                  <input
                    value={newClass.level}
                    onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: 6 / 8 / 12..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hình thức</label>
                  <select
                    value={newClass.default_mode}
                    onChange={(e) => setNewClass({ ...newClass, default_mode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ONLINE">ONLINE</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={newClass.start_date}
                    onChange={(e) => setNewClass({ ...newClass, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={newClass.end_date}
                    onChange={(e) => setNewClass({ ...newClass, end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {String(newClass.default_mode).toUpperCase() === "OFFLINE" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa điểm mặc định</label>
                  <input
                    value={newClass.default_location}
                    onChange={(e) => setNewClass({ ...newClass, default_location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: Nhà học sinh / Trung tâm..."
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Link online mặc định</label>
                  <input
                    value={newClass.default_online_link}
                    onChange={(e) => setNewClass({ ...newClass, default_online_link: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: Google Meet/Zoom link..."
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95 flex items-center gap-2
      ${isCreating ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo lớp"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorClasses;