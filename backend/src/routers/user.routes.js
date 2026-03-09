const express = require('express');
const router = express.Router();

// Import middleware bảo vệ
const { protect, authorize } = require('../middlewares/auth.middleware'); 

// Import controller
const {
  getUsers,
  updateUserStatus,
  approveUser,
} = require('../controllers/user.controller');

// Route duyệt user (approve PENDING → ACTIVE)
router.get('/users', protect, authorize('ADMIN'), getUsers);
router.put('/users/:id/status', protect, authorize('ADMIN'), updateUserStatus);
router.put('/users/:id/approve', protect, authorize('ADMIN'), approveUser);

module.exports = router;