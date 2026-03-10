const express = require('express');
const router = express.Router();

// Import middleware bảo vệ
const { protect, authorize } = require('../middlewares/auth.middleware'); 

// Import controller
const {
  getUsers,
  updateUserStatus,
  approveUser,
  updateUserProfile,
} = require('../controllers/user.controller');

// Route duyệt user (approve PENDING → ACTIVE)
router.get('/users', protect, authorize('ADMIN'), getUsers);
router.put('/users/:id/status', protect, authorize('ADMIN'), updateUserStatus);
router.put('/users/:id/approve', protect, authorize('ADMIN'), approveUser);

// Route cập nhật profile (cho user đã đăng nhập)
router.put('/profile', protect, updateUserProfile);

module.exports = router;