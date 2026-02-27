// src/pages/Tutor/TutorClasses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, Users, Trash2, BookOpen } from "lucide-react";
import api from "../../../services/api"; // axios instance của bạn

const TutorClasses = () => {
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state: search + filter (FE only)
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  // Modal thêm lớp
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

  // Modal chi tiết lớp
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal chọn học sinh để thêm
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/class");
      setClasses(res.data.data || []);
    } catch (err) {
      setError("Không thể tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await api.get("/students");
      setAllStudents(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải học sinh:", err);
    }
  };

  const fetchClassDetail = async (classId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/class/${classId}`);
      setClassDetail(res.data.data);
    } catch (err) {
      setError("Không thể tải chi tiết lớp");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.name) return alert("Tên lớp là bắt buộc");

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
    }
  };

  const handleAddStudentToClass = async (studentId) => {
    if (!selectedClass) return;

    try {
      await api.post(`/class/${selectedClass._id}/assign-student`, {
        student_user_id: studentId,
      });
      alert("Thêm học sinh vào lớp thành công!");
      fetchClassDetail(selectedClass._id);
      setIsAddStudentModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Thêm học sinh thất bại");
    }
  };

  const handleRemoveStudentFromClass = async (studentId) => {
    if (!selectedClass || !window.confirm("Xác nhận xóa học sinh khỏi lớp?")) return;

    try {
      await api.post(`/class/${selectedClass._id}/remove-student`, {
        student_user_id: studentId,
      });
      alert("Xóa học sinh khỏi lớp thành công!");
      fetchClassDetail(selectedClass._id);
    } catch (err) {
      alert(err.response?.data?.message || "Xóa học sinh thất bại");
    }
  };

  const closeDetailModal = () => {
    setSelectedClass(null);
    setClassDetail(null);
    setIsAddStudentModalOpen(false);
  };

  const filteredStudents = allStudents.filter((s) =>
    (s.full_name || s.student_full_name || "")
      .toLowerCase()
      .includes(searchStudent.toLowerCase())
  );

  // ---------- UI helpers (không ảnh hưởng backend) ----------
  const modeLabel = (m) => {
    const v = String(m || "").toUpperCase();
    if (v === "ONLINE") return "Trực tuyến";
    if (v === "OFFLINE") return "Trực tiếp";
    return m || "-";
  };

  // Nếu backend có is_active => dùng, nếu không => mặc định hoạt động
  const isActiveClass = (cls) => cls?.is_active !== false;

  // Học sinh: ưu tiên hiển thị tên, không có thì hiển thị số lượng
  const studentText = (cls) => {
    const arr = cls?.enrolled_students || [];
    // có thể là [{student_user_id:{full_name}}] hoặc [{full_name}] hoặc list id
    const names = arr
      .map((x) => x?.student_user_id?.full_name || x?.full_name || "")
      .filter(Boolean);

    if (names.length > 0) {
      // giống ảnh: "Nguyen Van B, Nguyen Van C"
      const max = 3;
      const shown = names.slice(0, max).join(", ");
      const more = names.length > max ? `, +${names.length - max}` : "";
      return shown + more;
    }
    return `${arr.length || 0} học sinh`;
  };

  // Ngày học: nếu backend có days_of_week / schedules thì render, không có thì "-"
  const dayLabel = (d) => {
    const map = {
      1: "Thứ 2",
      2: "Thứ 3",
      3: "Thứ 4",
      4: "Thứ 5",
      5: "Thứ 6",
      6: "Thứ 7",
      0: "CN",
    };
    return map[d] || "-";
  };

  const daysText = (cls) => {
    const candidates =
      cls?.days_of_week ||
      cls?.days ||
      cls?.day_of_week ||
      cls?.schedule_days ||
      null;

    // case: array of numbers
    if (Array.isArray(candidates) && candidates.length) {
      const uniq = Array.from(new Set(candidates.map((x) => Number(x))));
      return uniq.map(dayLabel).join(", ");
    }

    // case: schedules array on class
    const sched = cls?.schedules;
    if (Array.isArray(sched) && sched.length) {
      const uniq = Array.from(
        new Set(sched.map((s) => Number(s?.day_of_week)).filter((x) => !Number.isNaN(x)))
      );
      return uniq.length ? uniq.map(dayLabel).join(", ") : "-";
    }

    // case: single number
    if (typeof candidates === "number") return dayLabel(candidates);

    return "-";
  };

  // Stats giống ảnh (phần không có dữ liệu => 0)
  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(isActiveClass).length;
    const inactive = total - active;

    // backend hiện không có “chưa hoàn thành bài tập” => bỏ qua / để 0
    let unfinished = 0;
    // nếu sau này có field, tự động cộng:
    // unfinished = classes.reduce((sum,c)=>sum+(c.unfinished_homework_count||0),0)

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
        const name = (c?.name || "").toLowerCase();
        const mode = String(c?.default_mode || "").toLowerCase();
        const students = studentText(c).toLowerCase();
        return name.includes(q) || mode.includes(q) || students.includes(q);
      });
  }, [classes, query, statusFilter]);

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Title + Button (giống ảnh) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-7 w-7 text-slate-900" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Quản lý lớp học</h1>
          </div>
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

      {/* Stats row (giống ảnh) */}
      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {[
          { label: "Tổng số", value: stats.total },
          { label: "Hoạt động", value: stats.active },
          { label: "Không hoạt động", value: stats.inactive },
          { label: "Chưa hoàn thành bài tập", value: stats.unfinished },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-slate-100 px-6 py-5 text-slate-700"
          >
            <div className="text-sm">{s.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter (giống ảnh) */}
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

      {/* Table (giống ảnh) */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 bg-slate-100 px-6 py-4 text-base font-extrabold text-slate-800">
          <div className="col-span-3">Lớp</div>
          <div className="col-span-2">Hình thức</div>
          <div className="col-span-3">Học sinh</div>
          <div className="col-span-2">Ngày học</div>
          <div className="col-span-2">Trạng thái</div>
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
                  onClick={() => {
                    setSelectedClass(cls);
                    fetchClassDetail(cls._id);
                  }}
                  className="grid w-full grid-cols-12 gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <div className="col-span-3 text-sm font-semibold text-slate-900">
                    {cls.name}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {modeLabel(cls.default_mode)}
                  </div>

                  <div className="col-span-3 text-sm text-slate-700">
                    {studentText(cls)}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {daysText(cls)}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
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

      {/* ---------------- MODALS: giữ backend, chỉ làm đẹp UI ---------------- */}

      {/* Modal Thêm lớp mới */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsAddClassModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900">Thêm lớp học</h2>
            <p className="mt-1 text-sm text-slate-500">Nhập tên lớp để tạo lớp mới</p>

            <form onSubmit={handleAddClass} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tên lớp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="VD: Toán 06"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Các field khác bạn đang có backend vẫn giữ, nếu muốn hiển thị thì mở ra sau */}

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
                  className="rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết lớp */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Lớp: {selectedClass.name}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">Chi tiết lớp & danh sách học sinh</p>
              </div>
              <button
                onClick={closeDetailModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
              {detailLoading ? (
                <div className="flex justify-center py-14">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
                </div>
              ) : classDetail ? (
                <>
                  {/* Thông tin lớp (phần nào backend không có thì tự nhiên trống) */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Hình thức</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {modeLabel(classDetail?.class?.default_mode)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Số học sinh</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {classDetail?.enrolled_students?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Danh sách học sinh */}
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Users size={18} />
                        Học sinh trong lớp ({classDetail.enrolled_students?.length || 0})
                      </h3>
                      <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <Plus size={16} />
                        Thêm học sinh
                      </button>
                    </div>

                    {classDetail.enrolled_students?.length > 0 ? (
                      <div className="space-y-2">
                        {classDetail.enrolled_students.map((enroll) => (
                          <div
                            key={enroll._id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {enroll.student_user_id?.full_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {enroll.student_user_id?.email}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveStudentFromClass(enroll.student_user_id._id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-600">
                        Lớp chưa có học sinh nào
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-red-600">Không tải được chi tiết lớp</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chọn học sinh để thêm */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsAddStudentModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={22} />
            </button>

            <h2 className="text-lg font-extrabold text-slate-900">
              Thêm học sinh vào lớp {selectedClass?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Tìm kiếm và chọn học sinh</p>

            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="mt-4 max-h-80 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-600">
                  Không tìm thấy học sinh
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <button
                      type="button"
                      key={student._id}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 text-left hover:bg-slate-50"
                      onClick={() => handleAddStudentToClass(student._id)}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {student.full_name || student.student_full_name}
                        </p>
                        <p className="text-sm text-slate-500">{student.email}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">Thêm</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorClasses;