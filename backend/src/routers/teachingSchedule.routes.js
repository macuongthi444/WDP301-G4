// src/routes/teachingSchedule.routes.js
const express = require('express');
const router = express.Router();

const {
  createSchedule,
  getSchedulesByClass,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/teachingSchedule.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Tất cả route chỉ dành cho TUTOR
router.use(protect);
router.use(authorize('TUTOR'));

// Route theo classId
router.post('/:classId/schedules', createSchedule);
router.get('/:classId/schedules', getSchedulesByClass);

// Route theo scheduleId
router.put('/:classId/schedules/:scheduleId', updateSchedule);
router.delete('/:classId/schedules/:scheduleId', deleteSchedule);

module.exports = router;