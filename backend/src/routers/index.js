// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import tất cả các router con (module routes)
const roleRoutes = require('./role.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const classRoutes = require('./class.routes');
// Nếu sau này có thêm router khác, import ở đây
// Ví dụ:
// const userRoutes = require('./user.routes');
// const classRoutes = require('./class.routes');
// const attendanceRoutes = require('./attendance.routes');

// Gắn các router con vào router chính
router.use('/roles', roleRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/class', classRoutes);
// Thêm các route khác ở đây khi có
// router.use('/users', userRoutes);
// router.use('/classes', classRoutes);
// router.use('/attendances', attendanceRoutes);

// Route test hoặc welcome (optional)
router.get('/', (req, res) => {
  res.json({
    message: 'API Education Management - All routes are working',
    availableEndpoints: [
      '/api/roles',
      '/api/auth',
      '/api/user',
      '/api/class',
      // Thêm các endpoint khác khi có
    ]
  });
});

module.exports = router;