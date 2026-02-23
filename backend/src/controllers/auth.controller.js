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
    pass: process.env.EMAIL_PASS,
  },
});

// Helper gửi OTP
const sendOTPEmail = async (email, otp, type) => {
  let subject = type === 'verify_email' ? 'Xác thực email - Nền tảng Giáo dục' : 'Đặt lại mật khẩu - Nền tảng Giáo dục';
  let html = `
    <h2>${type === 'verify_email' ? 'Xác thực tài khoản' : 'Quên mật khẩu'}</h2>
    <p>Mã OTP của bạn: <strong>${otp}</strong></p>
    <p>Mã này có hiệu lực trong 10 phút.</p>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Nền tảng Giáo dục" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`OTP email sent to ${email} for ${type}`);
  } catch (error) {
    console.error('Lỗi gửi email OTP:', error);
    throw new Error('Không thể gửi email OTP');
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, roleNames = ['STUDENT'] } = req.body;

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
      // status mặc định là "PENDING" từ schema → không cần set thủ công
    });

    // Tạo OTP verify email
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
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
    console.error('Register error:', error.stack);
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// VERIFY EMAIL OTP
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Thiếu email hoặc OTP' });
    }

    const user = await User.findOne({ email })
      .select('+emailVerificationOTP +emailVerificationOTPExpires');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực rồi' });
    }

    // Debug
    console.log('--- DEBUG VERIFY EMAIL OTP ---');
    console.log('Email:', email);
    console.log('OTP nhập:', otp);
    console.log('OTP lưu:', user.emailVerificationOTP);
    console.log('ExpiresAt:', user.emailVerificationOTPExpires?.toISOString());
    console.log('Hiện tại:', new Date().toISOString());
    console.log('Còn lại (phút):', user.emailVerificationOTPExpires 
      ? (user.emailVerificationOTPExpires - new Date()) / 1000 / 60 
      : 'Không có');

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
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
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// LOGIN - Chỉ cho phép nếu status === 'ACTIVE'
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Thiếu email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + 10);

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = expiresDate;
    await user.save();

    await sendOTPEmail(email, otp, 'reset_password');

    res.status(200).json({ message: 'Mã OTP reset đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    // Debug OTP reset (tương tự verify)
    console.log('--- DEBUG RESET OTP ---');
    console.log('OTP nhập:', otp);
    console.log('OTP lưu:', user.resetPasswordOTP);
    console.log('ExpiresAt:', user.resetPasswordOTPExpires ? user.resetPasswordOTPExpires.toISOString() : 'Không có');
    console.log('Hiện tại:', new Date().toISOString());

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Cập nhật mật khẩu mới
    user.password_hash = await hashPassword(newPassword);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập lại.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
