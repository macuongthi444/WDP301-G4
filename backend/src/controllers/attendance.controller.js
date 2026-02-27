// src/controllers/attendance.controller.js
const Attendance = require('../models/attendance.model');
const TeachingSession = require('../models/teachingSession.model');
const Class = require('../models/class.model');
const User = require('../models/user.model'); // giả sử có model User cho học sinh

const ATT_STATUS = ["ATTENDED", "ABSENT"];

// 1. Điểm danh / Cập nhật điểm danh cho MỘT học sinh trong buổi học
exports.markAttendanceForStudent = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId, studentId } = req.params;
    const { status, note } = req.body;

    if (!ATT_STATUS.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ (ATTENDED hoặc ABSENT)" });
    }

    // Kiểm tra buổi học tồn tại và thuộc lớp
    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) {
      return res.status(404).json({ message: "Không tìm thấy buổi học" });
    }

    // Kiểm tra quyền tutor
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(403).json({ message: "Bạn không có quyền điểm danh cho lớp này" });
    }

    // (Tùy chọn) Kiểm tra học sinh có thuộc lớp không (nếu bạn có field students trong Class model)
    // Nếu không có, có thể bỏ qua để đơn giản

    const attendance = await Attendance.findOneAndUpdate(
      { session_id: sessionId, student_user_id: studentId },
      {
        status,
        note: note || null,
        marked_at: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: status === "ATTENDED" ? "Đã điểm danh có mặt" : "Đã điểm danh vắng mặt",
      data: attendance
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi khi điểm danh", error: error.message });
  }
};

// 2. Lấy điểm danh của MỘT học sinh trong buổi học
exports.getAttendanceForStudentInSession = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId, studentId } = req.params;

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) return res.status(404).json({ message: "Buổi học không tồn tại" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền xem" });

    const attendance = await Attendance.findOne({ session_id: sessionId, student_user_id: studentId })
      .populate('student_user_id', 'fullName email') // tùy field bạn có
      .lean();

    if (!attendance) {
      return res.status(404).json({ message: "Chưa điểm danh cho học sinh này trong buổi học" });
    }

    res.json({
      message: "Lấy thông tin điểm danh thành công",
      data: attendance
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3. Xóa điểm danh của một học sinh trong buổi học (nếu cần reset)
exports.deleteAttendanceForStudent = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId, studentId } = req.params;

    const attendance = await Attendance.findOneAndDelete({
      session_id: sessionId,
      student_user_id: studentId
    });

    if (!attendance) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi điểm danh" });
    }

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) return res.status(404).json({ message: "Buổi học không tồn tại" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền xóa" });

    res.json({ message: "Đã xóa điểm danh thành công", data: attendance });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. Lấy TOÀN BỘ điểm danh của buổi học (danh sách tất cả học sinh đã điểm danh)
exports.getAllAttendanceBySession = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) return res.status(404).json({ message: "Buổi học không tồn tại" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền xem" });

    const attendances = await Attendance.find({ session_id: sessionId })
      .populate('student_user_id', 'fullName email phone')
      .sort({ marked_at: 1 })
      .lean();

    res.json({
      message: "Lấy danh sách điểm danh buổi học thành công",
      total: attendances.length,
      data: attendances
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};