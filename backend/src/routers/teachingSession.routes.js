// src/routes/teachingSession.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware'); // giả sử bạn có middleware auth

const {
  getSessionDetail,
  getSessionsByClass,
  updateSessionStatus,
} = require('../controllers/teachingSession.controller');

router.use(protect);           // tất cả route cần đăng nhập
router.use(authorize('TUTOR'));


// src/routes/teachingSession.routes.js
router.get('/:classId/sessions', getSessionsByClass);
router.get('/:classId/sessions/:sessionId', getSessionDetail);
router.patch('/:classId/sessions/:sessionId/status', updateSessionStatus);

// Các route điểm danh, đánh giá, giao bài tập giữ nguyên...
module.exports = router;