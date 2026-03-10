// src/controllers/auth.controller.js
const User = require('../models/user.model');
const Role = require('../models/role.model');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.utils');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Cấu hình Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Phải dùng App Password
  },
});

// Helper gửi email OTP
const sendOTPEmail = async (email, otp, type) => {
  let subject = type === 'verify_email' ? 'Xác thực email - Nền tảng Giáo dục' : 'Đặt lại mật khẩu - Nền tảng Giáo dục';
  let html = `
    <h2>${type === 'verify_email' ? 'Xác thực tài khoản' : 'Quên mật khẩu'}</h2>
    <p>Mã OTP của bạn: <strong>${otp}</strong></p>
    <p>Mã này có hiệu lực trong 10 phút.</p>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
  `;

  await transporter.sendMail({
    from: `"Nền tảng Giáo dục" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

exports.register = async (req, res) => {
  try {
    let { email, password, full_name, phone } = req.body;

    // ÉP CỨNG role cho đăng ký thường
    const roleNames = ['TUTOR'];

    email = String(email || "").trim().toLowerCase();

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Thiếu email, password hoặc full_name' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const roles = await Role.find({ name: { $in: roleNames } });
    if (roles.length !== roleNames.length) {
      return res.status(400).json({ message: 'Một số role không tồn tại' });
    }

    const roleIds = roles.map(role => role._id);

    const hashedPassword = await hashPassword(password);

    const user = new User({
      email,
      password_hash: hashedPassword,
      full_name,
      phone,
      roles: roleIds,
      // status mặc định là "PENDING" từ schema
    });

    // Tạo OTP verify email
    const otp = String(
      otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false })
    );
    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + 10);

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = expiresDate;

    await user.save();

    await sendOTPEmail(email, otp, 'verify_email');

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng xác thực email bằng OTP. Tài khoản sẽ được kích hoạt sau khi admin duyệt.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// VERIFY EMAIL OTP
exports.verifyEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Thiếu email hoặc OTP" });
    }

    const user = await User.findOne({ email })
      .select("+emailVerificationOTP +emailVerificationOTPExpires");

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực rồi' });
    }

    const savedOtp = String(user.emailVerificationOTP || "").trim();
    if (!savedOtp || savedOtp !== otp) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }

    if (user.emailVerificationOTPExpires < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    // KHÔNG TRẢ TOKEN NGAY → chờ admin duyệt
    res.status(200).json({
      message: 'Xác thực email thành công. Tài khoản của bạn đang chờ admin duyệt để kích hoạt. Bạn sẽ nhận thông báo khi được phê duyệt.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// LOGIN - Chỉ cho phép nếu status === 'ACTIVE'
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = String(email || "").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc password' });
    }

    const user = await User.findOne({ email }).populate('roles', 'name');
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    if (user.status !== 'ACTIVE') {
      if (user.status === 'PENDING') {
        return res.status(403).json({ message: 'Tài khoản đang chờ admin duyệt. Vui lòng chờ phê duyệt.' });
      }
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles.map(role => role.name),
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// FORGOT PASSWORD - Gửi OTP reset
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    email = String(email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Thiếu email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const otp = String(
      otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false })
    );

    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + 10);

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = expiresDate;
    await user.save();

    await sendOTPEmail(email, otp, 'reset_password');

    res.status(200).json({ message: 'Mã OTP reset đã được gửi đến email của bạn' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// RESET PASSWORD với OTP
exports.resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    const user = await User.findOne({ email })
      .select("+resetPasswordOTP +resetPasswordOTPExpires");

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    const savedOtp = String(user.resetPasswordOTP || "").trim();
    if (!savedOtp || savedOtp !== otp) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }
    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Đặt lại mật khẩu
    user.password_hash = await hashPassword(newPassword);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.getMe = async (req, res) => {
  try {
    // req.user được set từ middleware verifyToken
    const user = await User.findById(req.user._id).populate('roles', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        roles: user.roles.map(role => role.name),
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CHANGE PASSWORD - Người dùng đã đăng nhập thay đổi mật khẩu
// Không cần OTP, chỉ cần nhập mật khẩu hiện tại + mật khẩu mới
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id; // Từ middleware protect

    if (!userId) {
      return res.status(401).json({ message: 'Không xác thực được người dùng' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được giống mật khẩu cũ' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    // Kiểm tra mật khẩu hiện tại có đúng không
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await hashPassword(newPassword);
    user.password_hash = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};