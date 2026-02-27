// src/pages/Tutor/TutorStudents.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, User } from "lucide-react";
import api from "../../../services/api";

const TutorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/filter UI only
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  // Modal thêm học sinh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Nam",
    school: "",
    grade: "",
    class_name: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/students");
      const data = res.data?.data || res.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setNewStudent({
      student_full_name: "",
      email: "",
      phone: "",
      dob: "",
      gender: "Nam",
      school: "",
      grade: "",
      class_name: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  // backend giữ nguyên
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.student_full_name || !newStudent.email || !newStudent.school) {
      alert("Vui lòng điền đầy đủ: Họ tên, Email, Trường học!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        student_full_name: newStudent.student_full_name.trim(),
        email: newStudent.email.trim().toLowerCase(),
        phone: newStudent.phone?.trim(),
        school: newStudent.school.trim(),
        grade: newStudent.grade?.trim(),
        class_name: newStudent.class_name?.trim(),
        gender: newStudent.gender,
        dob: newStudent.dob || undefined,
      };

      const res = await api.post("/students", payload);

      if (res.data.success) {
        const newStudentData = {
          _id: res.data.data.studentId,
          full_name: res.data.data.student_full_name,
          email: res.data.data.email,
          dob: newStudent.dob,
          gender: newStudent.gender,
          school: newStudent.school,
          grade: newStudent.grade,
          class_name: newStudent.class_name,
          status: "ACTIVE",
        };

        setStudents((prev) => [...prev, newStudentData]);
        alert("Thêm học sinh thành công! Mật khẩu đã được gửi qua email.");
        closeModal();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm học sinh thất bại";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- helpers UI ----------------
  const getName = (s) => s?.full_name || s?.student_full_name || s?.name || "Chưa cập nhật";
  const getGrade = (s) => s?.grade || s?.level || s?.student_grade || "-";
  const getClassName = (s) => s?.class_name || s?.class?.name || s?.className || "-";

  const dayLabel = (d) => {
    const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 0: "CN" };
    return map[d] || "-";
  };

  const getDays = (s) => {
    const candidates =
      s?.days_of_week || s?.days || s?.day_of_week || s?.study_days || s?.schedule_days || null;

    if (Array.isArray(candidates) && candidates.length) {
      const uniq = Array.from(new Set(candidates.map((x) => Number(x))));
      return uniq.map(dayLabel).join(", ");
    }
    if (typeof candidates === "number") return dayLabel(candidates);
    if (typeof candidates === "string" && candidates.trim()) return candidates;
    return "-";
  };

  const isActiveStudent = (s) => {
    if (typeof s?.is_active === "boolean") return s.is_active;
    const st = String(s?.status || "").toUpperCase();
    if (!st) return true;
    return st === "ACTIVE";
  };

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(isActiveStudent).length;
    const inactive = total - active;
    const unfinished = 0;
    return { total, active, inactive, unfinished };
  }, [students]);

  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return students
      .filter((s) => {
        if (statusFilter === "ACTIVE") return isActiveStudent(s);
        if (statusFilter === "INACTIVE") return !isActiveStudent(s);
        return true;
      })
      .filter((s) => {
        if (!q) return true;
        const hay = [getName(s), s?.email || "", String(getGrade(s)), getClassName(s), getDays(s)]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [students, query, statusFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Title + Add */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <User className="mt-1 h-7 w-7 text-slate-900" />
          <h1 className="text-3xl font-extrabold text-slate-900">Quản lý học sinh</h1>
        </div>

        <button
          onClick={openModal}
          disabled={loading}
          className="w-fit rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-8 py-3 text-base font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90 disabled:opacity-60"
        >
          Thêm học sinh
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
          placeholder="Tìm kiếm học sinh..."
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
          <div className="col-span-3">Tên</div>
          <div className="col-span-2">Khối</div>
          <div className="col-span-3">Lớp</div>
          <div className="col-span-2">Ngày học</div>
          <div className="col-span-2">Trạng thái</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Chưa có học sinh nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleStudents.map((s, idx) => {
              const active = isActiveStudent(s);
              return (
                <div
                  key={s?._id || s?.id || idx}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div className="col-span-3 text-sm font-semibold text-slate-900">{getName(s)}</div>
                  <div className="col-span-2 text-sm text-slate-700">{getGrade(s)}</div>
                  <div className="col-span-3 text-sm text-slate-700">{getClassName(s)}</div>
                  <div className="col-span-2 text-sm text-slate-700">{getDays(s)}</div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {active ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal thêm học sinh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900">Thêm học sinh</h2>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin cơ bản, mật khẩu sẽ gửi qua email.</p>

            <form onSubmit={handleAddStudent} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_full_name"
                  value={newStudent.student_full_name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newStudent.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày sinh</label>
                  <input
                    type="date"
                    name="dob"
                    value={newStudent.dob}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Giới tính</label>
                  <select
                    name="gender"
                    value={newStudent.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Trường học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="school"
                  value={newStudent.school}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Khối</label>
                  <input
                    type="text"
                    name="grade"
                    value={newStudent.grade}
                    onChange={handleInputChange}
                    placeholder="VD: 06, 8, 10..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Lớp</label>
                  <input
                    type="text"
                    name="class_name"
                    value={newStudent.class_name}
                    onChange={handleInputChange}
                    placeholder="VD: 10A1"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorStudents;