const express = require('express');
const router = express.Router();

// Import middleware bảo vệ
const { protect, authorize } = require('../middlewares/auth.middleware'); 

// Import controller
const {
  approveUser,
  
} = require('../controllers/user.controller'); 

// Route duyệt user (approve PENDING → ACTIVE)
router.put('/users/:id/approve', protect, authorize('ADMIN'), approveUser);

module.exports = router;