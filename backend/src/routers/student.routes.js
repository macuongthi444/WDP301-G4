// routes/student.routes.js
const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/my', protect, authorize('TUTOR' ), studentController.getMyStudents);

// POST: Tạo học sinh mới
router.post(
  '/',   // ← POST /api/students
  protect,
  authorize('TUTOR'),
  studentController.createStudentByTutor
);

// GET: Lấy danh sách học sinh
router.get(
  '/',   // ← Đổi từ '/students' thành '/' → GET /api/students
  protect,
  authorize('TUTOR'),
  studentController.getStudents
);
router.get(
  '/:studentId',   // ← Đổi từ '/students' thành '/' → GET /api/students
  protect,
  authorize('TUTOR'),
  studentController.getStudentById
);
router.patch(
  '/:studentId',   // ← Đổi từ '/students' thành '/' → GET /api/students
  protect,
  authorize('TUTOR'),
  studentController.updateStudent
);
module.exports = router;