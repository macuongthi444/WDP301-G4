// src/routes/role.routes.js
const express = require('express');
const router = express.Router();

const {
 approveUser
} = require('../controllers/user.controller'); // Adjust path nếu cần
// CRUD routes cho Role
router.put('/users/:id/approve', protect, authorize('ADMIN'), approveUser);

module.exports = router;