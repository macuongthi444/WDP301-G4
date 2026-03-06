import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, School, Calendar, BookOpen, Edit, X, Save, Loader2 } from "lucide-react";
import api from "../../../services/api";

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${studentId}`);
      const data = res.data?.data || res.data;
      if (data) {
        setStudent(data);
        // Khởi tạo form edit với dữ liệu hiện tại
        setEditForm({
          full_name: data.full_name || data.student_profile?.student_full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
          gender: data.gender || "",
          school: data.student_profile?.school || "",
          grade: data.student_profile?.grade || "",
          class_name: data.student_profile?.class_name || "",
        });
      } else {
        setError("Không tìm thấy thông tin học sinh");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.full_name || !editForm.email) {
      setEditError("Họ tên và email là bắt buộc");
      return;
    }

    try {
      setSaving(true);
      setEditError(null);

      const payload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone?.trim() || undefined,
        dob: editForm.dob || undefined,
        gender: editForm.gender || undefined,
        student_profile: {
          student_full_name: editForm.full_name.trim(),
          school: editForm.school?.trim() || undefined,
          grade: editForm.grade?.trim() || undefined,
          class_name: editForm.class_name?.trim() || undefined,
        },
      };

      const res = await api.patch(`/students/${studentId}`, payload);

      if (res.data.success) {
        // Cập nhật lại state student
        setStudent((prev) => ({
          ...prev,
          ...res.data.data,
          student_profile: {
            ...prev.student_profile,
            ...res.data.data.student_profile,
          },
        }));
        setIsEditModalOpen(false);
        alert("Cập nhật thông tin thành công!");
      }
    } catch (err) {
      setEditError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const getStatusDisplay = () => {
    if (!student) return { label: "-", color: "" };
    const status = String(student.status || "").toUpperCase();

    switch (status) {
      case "ACTIVE":
        return { label: "Hoạt động", color: "bg-emerald-100 text-emerald-800" };
      case "PENDING":
        return { label: "Chờ xác thực", color: "bg-amber-100 text-amber-800" };
      case "INACTIVE":
      case "BANNED":
        return { label: "Không hoạt động", color: "bg-slate-200 text-slate-700" };
      default:
        return { label: status || "Không xác định", color: "bg-gray-100 text-gray-700" };
    }
  };

  const statusInfo = getStatusDisplay();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          {error || "Không tìm thấy học sinh"}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={18} className="mr-2" />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Thông tin học sinh</h1>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          <Edit size={18} />
          Chỉnh sửa
        </button>
      </div>

      {/* Card chính */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student.full_name || student.student_profile?.student_full_name}</h2>
              <p className="mt-1 opacity-90">{student.email}</p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <InfoItem icon={Mail} color="indigo" label="Email" value={student.email} />
            <InfoItem icon={Phone} color="green" label="Số điện thoại" value={student.phone || "Chưa cập nhật"} />
            <InfoItem
              icon={Calendar}
              color="blue"
              label="Ngày sinh"
              value={student.dob ? new Date(student.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
            />
          </div>

          <div className="space-y-6">
            <InfoItem icon={School} color="purple" label="Trường học" value={student.student_profile?.school || "-"} />
            <InfoItem
              icon={BookOpen}
              color="amber"
              label="Khối / Lớp"
              value={
                [student.student_profile?.grade, student.student_profile?.class_name]
                  .filter(Boolean)
                  .join(" - ") || "Chưa cập nhật"
              }
            />
            <InfoItem icon={User} color="rose" label="Giới tính" value={student.gender || "Chưa cập nhật"} />
          </div>
        </div>
      </div>

      {/* Lịch học */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-xl font-bold mb-4">Lịch học</h3>
        {student.student_profile?.tutor_schedules?.length > 0 ? (
          <div className="space-y-3">
            {student.student_profile.tutor_schedules.map((sch, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][sch.weekday]}
                  </p>
                  <p className="text-sm text-slate-600">
                    {sch.startTime} - {sch.endTime} • {sch.subject || "Chưa xác định"}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${sch.isActive ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                  {sch.isActive ? "Đang hoạt động" : "Tạm dừng"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">Chưa có lịch học được thiết lập</p>
        )}
      </div>

      {/* Modal Chỉnh sửa */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa thông tin học sinh</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày sinh</label>
                  <input
                    type="date"
                    name="dob"
                    value={editForm.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Giới tính</label>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Trường học</label>
                  <input
                    type="text"
                    name="school"
                    value={editForm.school}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Khối</label>
                  <input
                    type="text"
                    name="grade"
                    value={editForm.grade}
                    onChange={handleInputChange}
                    placeholder="VD: 10"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Lớp</label>
                  <input
                    type="text"
                    name="class_name"
                    value={editForm.class_name}
                    onChange={handleInputChange}
                    placeholder="VD: 10A1"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu thay đổi
                    </>
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

const InfoItem = ({ icon: Icon, color, label, value }) => (
  <div className="flex items-start gap-4">
    <div className={`p-3 bg-${color}-50 rounded-lg`}>
      <Icon className={`text-${color}-600`} size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default StudentDetail;