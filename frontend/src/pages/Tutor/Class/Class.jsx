// src/pages/Tutor/TutorClasses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, Users, BookOpen, Trash2 } from "lucide-react";
import api from "../../../services/api";

const TutorClasses = () => {
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search/filter FE
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

  // Modal thêm học sinh vào lớp
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
      setClasses([]);
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

  // backend giữ nguyên
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

  // backend giữ nguyên
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

  // backend giữ nguyên
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

  const modeLabel = (m) =>
    String(m || "").toUpperCase() === "ONLINE" ? "Trực tuyến" : "Trực tiếp";

  const isActiveClass = (cls) => cls?.is_active !== false;

  const dayLabel = (d) => {
    const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 0: "CN" };
    return map[d] || "-";
  };

  const getDaysText = (cls) => {
    const candidates =
      cls?.days_of_week || cls?.days || cls?.day_of_week || cls?.schedule_days || null;

    if (Array.isArray(candidates) && candidates.length) {
      const uniq = Array.from(new Set(candidates.map((x) => Number(x))));
      return uniq.map(dayLabel).join(", ");
    }

    const sched = cls?.schedules;
    if (Array.isArray(sched) && sched.length) {
      const uniq = Array.from(
        new Set(sched.map((s) => Number(s?.day_of_week)).filter((x) => !Number.isNaN(x)))
      );
      return uniq.length ? uniq.map(dayLabel).join(", ") : "-";
    }
    if (typeof candidates === "number") return dayLabel(candidates);
    return "-";
  };

  const studentText = (cls) => {
    const arr = cls?.enrolled_students || [];
    const names = arr
      .map((x) => x?.student_user_id?.full_name || x?.full_name || "")
      .filter(Boolean);
    if (!names.length) return `${arr.length || 0} học sinh`;
    const max = 2;
    return names.slice(0, max).join(", ") + (names.length > max ? `, +${names.length - max}` : "");
  };

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
        const hay = [c?.name || "", c?.level || "", String(c?.default_mode || ""), studentText(c)]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [classes, query, statusFilter]);

  const filteredStudents = allStudents.filter((s) =>
    (s.full_name || s.student_full_name || "")
      .toLowerCase()
      .includes(searchStudent.toLowerCase())
  );

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
                  <div className="col-span-3 text-sm font-semibold text-slate-900">{cls.name}</div>
                  <div className="col-span-2 text-sm text-slate-700">{modeLabel(cls.default_mode)}</div>
                  <div className="col-span-3 text-sm text-slate-700">{studentText(cls)}</div>
                  <div className="col-span-2 text-sm text-slate-700">{getDaysText(cls)}</div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
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

      {/* Modal Thêm lớp (đã khôi phục full field) */}
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
                  className="rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết lớp (giữ nguyên backend assign/remove) */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Lớp: {selectedClass.name}</h2>
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Hình thức</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {modeLabel(classDetail?.class?.default_mode)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Cấp độ</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {classDetail?.class?.level || "-"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Số học sinh</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {classDetail?.enrolled_students?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Ngày bắt đầu</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {classDetail?.class?.start_date
                          ? new Date(classDetail.class.start_date).toLocaleDateString("vi-VN")
                          : "-"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Ngày kết thúc</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {classDetail?.class?.end_date
                          ? new Date(classDetail.class.end_date).toLocaleDateString("vi-VN")
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">Địa điểm / Link mặc định</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {String(classDetail?.class?.default_mode).toUpperCase() === "OFFLINE"
                        ? classDetail?.class?.default_location || "-"
                        : classDetail?.class?.default_online_link || "-"}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Users size={18} />
                        Học sinh trong lớp ({classDetail?.enrolled_students?.length || 0})
                      </h3>

                      <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <Plus size={16} />
                        Thêm học sinh
                      </button>
                    </div>

                    {classDetail?.enrolled_students?.length ? (
                      <div className="space-y-2">
                        {classDetail.enrolled_students.map((enroll) => (
                          <div
                            key={enroll._id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {enroll.student_user_id?.full_name || "-"}
                              </div>
                              <div className="text-sm text-slate-500">{enroll.student_user_id?.email || "-"}</div>
                            </div>

                            <button
                              onClick={() => handleRemoveStudentFromClass(enroll.student_user_id?._id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Xóa khỏi lớp"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-600">
                        Lớp chưa có học sinh nào
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
                  Không tải được chi tiết lớp
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn học sinh để thêm */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">
                Thêm học sinh vào lớp {selectedClass?.name}
              </h2>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="mt-4 max-h-80 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-600">
                  Không tìm thấy học sinh
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => handleAddStudentToClass(student._id)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 text-left hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {student.full_name || student.student_full_name}
                        </div>
                        <div className="text-sm text-slate-500">{student.email}</div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">Thêm</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
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