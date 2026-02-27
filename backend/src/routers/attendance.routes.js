// src/routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');

const {
  markAttendanceForStudent,
  getAttendanceForStudentInSession,
  deleteAttendanceForStudent,
  getAllAttendanceBySession,
} = require('../controllers/attendance.controller');

router.use(protect);
router.use(authorize('tutor')); // chỉ tutor

// Điểm danh / cập nhật cho 1 học sinh
router.put('/:classId/sessions/:sessionId/students/:studentId/attendance', markAttendanceForStudent);

// Lấy điểm danh của 1 học sinh trong buổi
router.get('/:classId/sessions/:sessionId/students/:studentId/attendance', getAttendanceForStudentInSession);

// Xóa điểm danh của 1 học sinh
router.delete('/:classId/sessions/:sessionId/students/:studentId/attendance', deleteAttendanceForStudent);

// Lấy toàn bộ điểm danh của buổi (danh sách tất cả hs đã điểm)
router.get('/:classId/sessions/:sessionId/attendance', getAllAttendanceBySession);

module.exports = router;