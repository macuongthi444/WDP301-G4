import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, School, Calendar, BookOpen, Edit } from "lucide-react";
import api from "../../../services/api";

const StudentDetail = () => {
  const { studentId } = useParams(); // Lấy id từ URL: /tutor/students/:studentId
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/students/${studentId}`);
        console.log("API response:", res.data);
        const data = res.data?.data || res.data;

        if (data) {
          setStudent(data);
        } else {
          setError("Không tìm thấy thông tin học sinh");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin học sinh");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentDetail();
    }
  }, [studentId]);

  // Helper để lấy thông tin từ student_profile hoặc root
  const getField = (rootKey, profileKey) => {
    if (!student) return "-";
    return (
      student?.student_profile?.[profileKey] ||
      student?.[rootKey] ||
      "-"
    );
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
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
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Thông tin học sinh
          </h1>
        </div>

        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          onClick={() => alert("Chức năng chỉnh sửa đang phát triển")}
        >
          <Edit size={18} />
          Chỉnh sửa thông tin
        </button>
      </div>

      {/* Card chính */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner / Header info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getField("full_name", "student_full_name")}</h2>
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
          {/* Cột 1 */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Mail className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{student.email || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Phone className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Số điện thoại</p>
                <p className="font-medium">{student.phone || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày sinh</p>
                <p className="font-medium">
                  {student.dob
                    ? new Date(student.dob).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <School className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Trường học</p>
                <p className="font-medium">{getField("school", "school")}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <BookOpen className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Khối / Lớp</p>
                <p className="font-medium">
                  {getField("grade", "grade") !== "-" && getField("grade", "grade")}
                  {getField("grade", "grade") !== "-" && getField("class_name", "class_name") !== "-" && " - "}
                  {getField("class_name", "class_name")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 rounded-lg">
                <User className="text-rose-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Giới tính</p>
                <p className="font-medium">{student.gender || "Chưa cập nhật"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phần lịch học / ghi chú (có thể mở rộng sau) */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-xl font-bold mb-4">Lịch học (nếu có)</h3>
        {student.student_profile?.tutor_schedules?.length > 0 ? (
          <div className="space-y-3">
            {student.student_profile.tutor_schedules.map((schedule, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][schedule.weekday || 0]}
                  </p>
                  <p className="text-sm text-slate-600">
                    {schedule.startTime} - {schedule.endTime} • {schedule.subject || "Chưa xác định"}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {schedule.isActive ? "Đang hoạt động" : "Tạm dừng"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">Chưa có lịch học được thiết lập</p>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;