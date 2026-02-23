// src/routes/role.routes.js
const express = require('express');
const router = express.Router();

const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require('../controllers/role.controller'); // Adjust path nếu cần
// CRUD routes cho Role
router.post('/', createRole);           // POST /api/roles → Tạo mới
router.get('/', getAllRoles);           // GET /api/roles → Lấy tất cả
router.get('/:id', getRoleById);        // GET /api/roles/:id → Lấy theo ID
router.put('/:id', updateRole);         // PUT /api/roles/:id → Cập nhật
router.delete('/:id', deleteRole);      // DELETE /api/roles/:id → Xóa

module.exports = router;