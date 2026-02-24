// src/routes/syllabus.routes.js
const express = require('express');
const router = express.Router();

const {
  createSyllabus,
  getMySyllabi,
  getSyllabusDetail,
  updateSyllabus,
  deleteSyllabus,
} = require('../controllers/syllabus.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Tất cả route chỉ dành cho TUTOR
router.use(protect);
router.use(authorize('TUTOR'));

router.post('/', createSyllabus);
router.get('/', getMySyllabi);
router.get('/:id', getSyllabusDetail);
router.put('/:id', updateSyllabus);
router.delete('/:id', deleteSyllabus);

module.exports = router;