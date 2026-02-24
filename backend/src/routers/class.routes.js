// src/routes/class.routes.js
const express = require('express');
const router = express.Router();

const {
  createClass,
  getMyClasses,
  getClassDetail,
  updateClass,
  deleteClass,
  assignStudent,
  removeStudent,
} = require('../controllers/class.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Tất cả route chỉ dành cho TUTOR
router.use(protect);
router.use(authorize('TUTOR'));

router.post('/', createClass);
router.get('/', getMyClasses);
router.get('/:id', getClassDetail);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// Quản lý học sinh trong lớp
router.post('/:id/assign-student', assignStudent);
router.post('/:id/remove-student', removeStudent);

module.exports = router;