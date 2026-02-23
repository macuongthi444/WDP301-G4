// src/controllers/role.controller.js
const Role = require('../models/role.model'); // Adjust path nếu cần

// CREATE - Tạo role mới
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validation cơ bản
    if (!name) {
      return res.status(400).json({ message: 'Tên role là bắt buộc' });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role này đã tồn tại' });
    }

    const role = new Role({
      name,
      description: description || '',
      permissions: permissions || [],
    });

    const savedRole = await role.save();
    res.status(201).json({
      message: 'Tạo role thành công',
      data: savedRole,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi tạo role',
      error: error.message,
    });
  }
};

// READ - Lấy tất cả roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ created_at: -1 });
    res.status(200).json({
      message: 'Lấy danh sách roles thành công',
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy roles',
      error: error.message,
    });
  }
};

// READ - Lấy một role theo ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy role' });
    }
    res.status(200).json({
      message: 'Lấy role thành công',
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy role',
      error: error.message,
    });
  }
};

// UPDATE - Cập nhật role
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy role' });
    }

    // Chỉ cập nhật nếu có field trong body
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;

    const updatedRole = await role.save();

    res.status(200).json({
      message: 'Cập nhật role thành công',
      data: updatedRole,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi cập nhật role',
      error: error.message,
    });
  }
};

// DELETE - Xóa role
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy role để xóa' });
    }
    res.status(200).json({
      message: 'Xóa role thành công',
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi xóa role',
      error: error.message,
    });
  }
};