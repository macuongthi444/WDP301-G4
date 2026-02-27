// src/routes/teachingSession.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware'); // giả sử bạn có middleware auth

const {
  createManualSession,
  generateSessionsFromSchedule,
  getSessionsByClass,
  updateSessionStatus,
} = require('../controllers/teachingSession.controller');

router.use(protect);           // tất cả route cần đăng nhập
router.use(authorize('TUTOR'));

router.route('/:classId/sessions')
  .get(getSessionsByClass)
  .post(createManualSession);

router.post('/:classId/generate-sessions', generateSessionsFromSchedule);

router.patch('/:classId/sessions/:sessionId/status', updateSessionStatus);

module.exports = router;