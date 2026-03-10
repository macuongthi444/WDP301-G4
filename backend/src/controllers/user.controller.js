const User = require('../models/user.model');
const Role = require('../models/role.model');

const escapeRegex = (value = '') => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Lấy danh sách user cho admin
// Hỗ trợ:
// - search theo full_name
// - filter theo role
// - filter theo status
exports.getUsers = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim();
    const status = String(req.query.status || '').trim().toUpperCase();

    const filter = {};
    const allowedStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];

    if (search) {
      filter.full_name = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (role) {
      const normalizedRole = role.replace(/^ROLE_/i, '').trim();

      const roleDoc = await Role.findOne({
        name: { $regex: `^${escapeRegex(normalizedRole)}$`, $options: 'i' },
      });

      if (!roleDoc) {
        return res.status(200).json([]);
      }

      filter.roles = roleDoc._id;
    }

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: PENDING, ACTIVE, INACTIVE',
        });
      }

      filter.status = status;
    }

    const users = await User.find(filter)
      .populate('roles', 'name')
      .select(
        '-password_hash -emailVerificationOTP -emailVerificationOTPExpires -resetPasswordOTP -resetPasswordOTPExpires'
      )
      .sort({ created_at: -1 });

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      roles: (user.roles || []).map((role) => ({
        _id: role._id,
        name: role.name,
      })),
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách tài khoản',
      error: error.message,
    });
  }
};

// Cập nhật trạng thái user theo giá trị truyền lên
// Hỗ trợ: PENDING, ACTIVE, INACTIVE
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
    const normalizedStatus = String(status || '').trim().toUpperCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: PENDING, ACTIVE, INACTIVE',
      });
    }

    const user = await User.findById(id).populate('roles', 'name');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    user.status = normalizedStatus;
    await user.save();

    return res.status(200).json({
      message: 'Cập nhật trạng thái thành công',
      data: {
        _id: user._id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi cập nhật trạng thái',
      error: error.message,
    });
  }
};

// Duyệt tài khoản từ PENDING -> ACTIVE
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Tài khoản không ở trạng thái chờ duyệt',
      });
    }

    user.status = 'ACTIVE';
    await user.save();

    return res.status(200).json({
      message: 'Tài khoản đã được duyệt thành công',
      data: {
        _id: user._id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('approveUser error:', error);
    return res.status(500).json({
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

// Cập nhật profile của user (phone)
// Endpoint cho phép user đăng nhập sửa thông tin cá nhân
exports.updateUserProfile = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user._id; // Từ middleware auth

    if (!userId) {
      return res.status(401).json({ message: 'Không xác thực được người dùng' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // Validate phone if provided
    if (phone) {
      const phoneTrimmed = String(phone).trim();
      // Phone validation: Vietnamese phone pattern
      if (phoneTrimmed && !/^(84|0[3-9])[0-9]{8,9}$/.test(phoneTrimmed)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      user.phone = phoneTrimmed || null;
    }

    await user.save();

    // Return updated user info
    const updatedUser = await User.findById(userId).populate('roles', 'name');

    return res.status(200).json({
      message: 'Cập nhật hồ sơ thành công',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone || '',
        roles: updatedUser.roles.map(role => role.name),
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return res.status(500).json({
      message: 'Lỗi server khi cập nhật hồ sơ',
      error: error.message,
    });
  }
};