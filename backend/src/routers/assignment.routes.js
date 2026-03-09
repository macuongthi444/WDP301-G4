// src/routes/assignment.routes.js
const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignment.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Tất cả route dưới đây yêu cầu đăng nhập và chỉ tutor mới được truy cập
router.use(protect);
router.use(authorize('TUTOR'));

// Tạo bài tập mới (status mặc định DRAFT)
router.post('/', assignmentController.createAssignment);

// Giao bài tập (chuyển status thành PUBLISHED)
router.put('/:id/publish', assignmentController.publishAssignment);

// Lấy danh sách bài tập của tutor (có filter class_id, status)
router.get('/', assignmentController.getTutorAssignments);

// Lấy chi tiết 1 bài tập + thống kê nộp bài
router.get('/:id', assignmentController.getAssignmentById);

// Cập nhật bài tập (chỉ khi còn DRAFT)
router.put('/:id', assignmentController.updateAssignment);

// Xóa bài tập (xóa luôn submission và file liên quan)
router.delete('/:id', assignmentController.deleteAssignment);

// Lấy số lượng học sinh được giao bài tập (dựa vào lớp)
router.get('/:assignmentId/students/count', assignmentController.getAssignedStudentsCount);

// Tutor chấm bài nộp của học sinh (chuyển SUBMITTED → GRADED)
router.put('/:assignmentId/students/:studentId/grade', assignmentController.gradeSubmission);

module.exports = router;