// src/controllers/teachingSession.controller.js
const TeachingSession = require('../models/teachingSession.model');
const Class = require('../models/class.model');
const WeeklySchedule = require('../models/weeklySchedule.model');
const ClassEnrollment = require('../models/classEnrollment.model');
const Attendance = require('../models/attendance.model');

// Helper: Lấy học sinh active của lớp
async function getActiveStudentsOfClass(classId) {
  const enrollments = await ClassEnrollment.find({
    class_id: classId,
    status: "ACTIVE"
  }).populate('student_user_id', 'fullName email phone');
  
  return enrollments.map(enroll => enroll.student_user_id);
}

// 1. Lấy chi tiết một buổi học
exports.getSessionDetail = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId })
      .populate('schedule_id');

    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    res.json({
      message: "Lấy chi tiết buổi học thành công",
      data: session
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Lấy danh sách buổi học của lớp (filter theo thời gian, trạng thái)
exports.getSessionsByClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { status, startDate, endDate } = req.query;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const filter = { class_id: classId };
    if (status) filter.status = status;
    if (startDate) filter.start_at = { $gte: new Date(startDate) };
    if (endDate) filter.start_at = { ...filter.start_at, $lte: new Date(endDate) };

    const sessions = await TeachingSession.find(filter)
      .sort({ start_at: 1 })
      .populate('schedule_id');

    res.json({
      message: "Lấy danh sách buổi học thành công",
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3. Cập nhật trạng thái buổi học (COMPLETED, CANCELLED, RESCHEDULED...)
exports.updateSessionStatus = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;
    const { status } = req.body;

    const session = await TeachingSession.findOneAndUpdate(
      { _id: sessionId, class_id: classId },
      { status },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    res.json({ message: "Cập nhật trạng thái thành công", data: session });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Các chức năng khác: giao bài tập, điểm danh, đánh giá... giữ nguyên như trước
// (bạn có thể thêm vào đây nếu cần)