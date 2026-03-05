// src/pages/Tutor/Class/ClassDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, Loader2 } from "lucide-react";
import api from "../../../services/api";

const modeLabel = (m) => (String(m || "").toUpperCase() === "ONLINE" ? "Trực tuyến" : "Trực tiếp");

const dayLabel = (d) => {
  const map = { 1: "Thứ hai", 2: "Thứ ba", 3: "Thứ tư", 4: "Thứ năm", 5: "Thứ sáu", 6: "Thứ bảy", 0: "Chủ nhật" };
  return map[Number(d)] || "-";
};

// ✅ vì DB bạn dùng full_name + student_profile.student_full_name
const pickStudentName = (u) =>
  u?.full_name ||
  u?.fullName ||
  u?.student_profile?.student_full_name ||
  u?.student_profile?.fullName ||
  "Học sinh";

const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [detail, setDetail] = useState(null); // { class, enrolled_students }
  const [schedules, setSchedules] = useState([]);

  // add student modal
  const [allStudents, setAllStudents] = useState([]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErr(null);

      const [classRes, schedRes] = await Promise.all([
        api.get(`/class/${classId}`),
        api.get(`/class/${classId}/schedules`).catch(() => ({ data: { data: [] } })), // nếu chưa có route thì vẫn chạy UI
      ]);

      setDetail(classRes.data.data);
      setSchedules(schedRes.data.data?.data || schedRes.data.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Không thể tải chi tiết lớp");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForModal = async () => {
    try {
      const res = await api.get("/students");
      setAllStudents(res.data.data || []);
    } catch (e) {
      // không chặn UI
      setAllStudents([]);
    }
  };

  const cls = detail?.class;
  const enrolled = detail?.enrolled_students || [];

  const active = cls?.is_active !== false;

  const onlineLink =
    cls?.default_online_link ||
    schedules?.find((s) => String(s?.mode).toUpperCase() === "ONLINE")?.online_link ||
    "";

  const curriculumText = cls?.curriculum?.name || cls?.curriculum || "—";

  const scheduleTextList = useMemo(() => {
    const list = Array.isArray(schedules) ? schedules : [];
    return list
      .filter((s) => s?.is_active !== false)
      .slice()
      .sort((a, b) => String(a?.start_time || "").localeCompare(String(b?.start_time || "")))
      .map((s) => `${dayLabel(s.day_of_week)} - ${s.start_time || "--:--"}`);
  }, [schedules]);

  const openAddStudent = async () => {
    setIsAddStudentOpen(true);
    await fetchStudentsForModal();
  };

  const filteredStudents = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    if (!q) return allStudents;

    return allStudents.filter((s) => {
      const name = pickStudentName(s).toLowerCase();
      const email = String(s?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [allStudents, searchStudent]);

  const handleAddStudentToClass = async (studentId) => {
    try {
      await api.post(`/class/${classId}/assign-student`, { student_user_id: studentId });
      alert("Thêm học sinh vào lớp thành công!");
      setIsAddStudentOpen(false);
      setSearchStudent("");
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Thêm học sinh thất bại");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Xác nhận xóa học sinh khỏi lớp?")) return;
    try {
      await api.post(`/class/${classId}/remove-student`, { student_user_id: studentId });
      alert("Xóa học sinh khỏi lớp thành công!");
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Xóa học sinh thất bại");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-slate-700 hover:text-slate-900">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{err}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      {/* Top card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm text-slate-500">Lớp</div>
            <div className="text-xl font-extrabold text-slate-900">{cls?.name || "—"}</div>

            <div className="mt-3 text-sm text-slate-700">
              Hình thức: <span className="font-semibold">{modeLabel(cls?.default_mode)}</span>
            </div>

            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                {active ? "Hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>

          {/* Sửa: bạn có thể nối thêm sau */}
          <button
            type="button"
            onClick={() => alert("Chức năng Sửa: bạn có thể làm form edit sau")}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Sửa
          </button>
        </div>
      </div>

      {/* Content card giống hình */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-blue-700 font-extrabold border-b border-slate-200 pb-2 w-fit">Tổng quan</div>

        <div className="mt-3 space-y-3 text-sm text-slate-800">
          <div className="bg-blue-50 rounded-lg p-3">
            <span className="font-semibold">Online Link: </span>
            {onlineLink ? (
              <a className="text-blue-600 underline" href={onlineLink} target="_blank" rel="noreferrer">
                {onlineLink}
              </a>
            ) : (
              <span>—</span>
            )}
          </div>

          <div>
            <span className="font-semibold">Giáo trình:</span> {curriculumText}
          </div>
        </div>

        {/* Lịch dạy */}
        <div className="mt-6">
          <div className="text-blue-700 font-extrabold border-b border-blue-700 pb-1 w-fit">Lịch dạy</div>
          <div className="mt-3 space-y-1 text-sm text-slate-800">
            {scheduleTextList.length ? scheduleTextList.map((t, idx) => <div key={idx}>{t}</div>) : <div>—</div>}
          </div>
        </div>

        {/* Học sinh */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-blue-700 font-extrabold border-b border-blue-700 pb-1 w-fit">Học sinh</div>

          <button
            onClick={openAddStudent}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={16} /> Thêm học sinh
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {enrolled.length ? (
            enrolled.map((enroll) => {
              const st = enroll?.student_user_id;
              return (
                <div key={enroll._id} className="flex items-center justify-between rounded-lg px-2 py-1">
                  <div className="text-sm text-slate-900">{pickStudentName(st)}</div>
                  <button
                    onClick={() => handleRemoveStudent(st?._id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="Xóa khỏi lớp"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-600">Chưa có học sinh</div>
          )}
        </div>

        {/* Ghi chú */}
        <div className="mt-6">
          <div className="text-blue-700 font-extrabold border-b border-blue-700 pb-1 w-fit">Ghi chú</div>
          <div className="mt-3 text-sm text-slate-700">{cls?.note || cls?.description || "—"}</div>
        </div>
      </div>

      {/* Modal chọn học sinh */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">Thêm học sinh vào lớp</h2>
              <button
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setSearchStudent("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Tìm theo tên/email..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="mt-4 max-h-80 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-600">Không tìm thấy học sinh</div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => handleAddStudentToClass(student._id)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 text-left hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{pickStudentName(student)}</div>
                        <div className="text-sm text-slate-500">{student.email || "-"}</div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">Thêm</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setSearchStudent("");
                }}
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
}
export default ClassDetail;