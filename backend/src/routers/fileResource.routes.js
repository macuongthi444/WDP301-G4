// src/routes/fileResource.routes.js
const express = require('express');
const router = express.Router();

const {
  uploadFile,
  getFilesByOwner,
  deleteFile,
} = require('../controllers/fileResource.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Bảo vệ route: chỉ TUTOR/ADMIN
router.use(protect);
router.use(authorize('TUTOR', 'ADMIN'));

router.post('/upload', uploadFile);
router.get('/', getFilesByOwner); // ?ownerType=SYLLABUS&ownerId=...
router.delete('/:id', deleteFile);

module.exports = router;