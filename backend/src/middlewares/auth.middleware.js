// src/middlewares/auth.middleware.js
const { verifyToken } = require('../utils/auth.utils');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const user = await User.findById(decoded.id).populate('roles', 'name');
  if (!user) {
    return res.status(401).json({ message: 'Người dùng không tồn tại' });
  }

  req.user = user;
  next();
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const hasPermission = req.user.roles.some(role => 
      allowedRoles.includes(role) || allowedRoles.includes(role.name)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Chỉ gia sư mới có quyền thực hiện hành động này' });
    }
    next();
  };
};
