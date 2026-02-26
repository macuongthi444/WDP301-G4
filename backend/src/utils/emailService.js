// src/utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

const sendOTPEmail = async (email, otp, type = 'verify_email') => {
  const isVerify = type === 'verify_email';
  const subject = isVerify ? 'Xác thực email - Nền tảng Giáo dục' : 'Đặt lại mật khẩu - Nền tảng Giáo dục';
  
  const html = `
    <h2>${isVerify ? 'Xác thực tài khoản' : 'Quên mật khẩu'}</h2>
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

const sendStudentAccountEmail = async ({ to, studentName, tutorName, password, loginUrl }) => {
  const html = `
    <h2>Tài khoản học sinh đã được tạo</h2>
    <p>Xin chào phụ huynh/học sinh,</p>
    <p>Gia sư <strong>${tutorName}</strong> đã tạo tài khoản cho:</p>
    <ul>
      <li>Họ tên học sinh: <strong>${studentName}</strong></li>
      <li>Email đăng nhập: <strong>${to}</strong></li>
      <li>Mật khẩu tạm thời: <strong>${password}</strong></li>
    </ul>
    <p>Vui lòng đăng nhập tại: <a href="${loginUrl}">${loginUrl}</a></p>
    <p>Khuyến nghị: Đổi mật khẩu ngay sau khi đăng nhập lần đầu.</p>
    <p>Trân trọng,<br>Nền tảng Giáo dục</p>
  `;

  await transporter.sendMail({
    from: `"Nền tảng Giáo dục" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Thông tin tài khoản học sinh mới',
    html,
  });
};

module.exports = {
  sendOTPEmail,
  sendStudentAccountEmail,
};