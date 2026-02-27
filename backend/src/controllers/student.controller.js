// src/controllers/student.controller.js
const User = require('../models/user.model');
const Role = require('../models/role.model');
const bcrypt = require('bcryptjs');
const { generateRandomPassword } = require('../utils/auth.utils'); // bạn tự tạo hàm này
const { sendStudentAccountEmail } = require('../utils/emailService'); // gửi mail thông báo

/**
 * @route   POST /api/students
 * @desc    Gia sư tạo tài khoản cho học sinh
 * @access  Private (Tutor only)
 */
exports.createStudentByTutor = async (req, res) => {
  try {
    const tutor = req.user;

    // Kiểm tra quyền (đã fix ở bước trước, dùng cách linh hoạt)
    const hasTutorRole = tutor.roles.some(role => 
      (typeof role === 'string' && role === 'TUTOR') ||
      (role && role.name === 'TUTOR')
    );

    if (!hasTutorRole) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ gia sư mới có quyền tạo tài khoản học sinh',
      });
    }

    const {
      student_full_name,
      email,
      phone,
      school,
      grade,
      class_name,
      gender,
      dob,
      tutor_schedules = [],
    } = req.body;

    // Validate cơ bản
    if (!student_full_name || !email) {
      return res.status(400).json({ success: false, message: 'Thiếu họ tên hoặc email' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    }

    // Tìm role STUDENT (bắt buộc phải tồn tại)
    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      return res.status(500).json({
        success: false,
        message: 'Hệ thống chưa có role STUDENT. Vui lòng liên hệ admin.',
      });
    }

    // Tạo mật khẩu ngẫu nhiên
    const randomPassword = generateRandomPassword(12); // hàm bạn đã có
    const password_hash = await bcrypt.hash(randomPassword, 12);

    // Tạo student profile
    const studentProfile = {
      student_full_name: student_full_name.trim(),
      school: school?.trim(),
      grade: grade?.trim(),
      class_name: class_name?.trim(),
      gender,
      dob: dob ? new Date(dob) : undefined,
      tutor_schedules: tutor_schedules.map(s => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject || '',
        isActive: true,
      })),
      has_completed_assignment: false,
      status: 'ACTIVE',
    };

    // Tạo user học sinh
    const newStudent = new User({
      email: email.toLowerCase().trim(),
      password_hash,
      full_name: student_full_name.trim(),
      phone: phone?.trim(),
      status: 'PENDING',
      roles: [studentRole._id],          // ← ĐÚNG: mảng ObjectId
      student_profile: studentProfile,
      isEmailVerified: false,
    });

    await newStudent.save();

    // Gửi email thông báo (dùng sendStudentAccountEmail nếu đã có)
    try {
      await sendStudentAccountEmail({
        to: email,
        studentName: student_full_name,
        tutorName: tutor.full_name,
        password: randomPassword,
        loginUrl: 'https://your-app.com/login',
      });
    } catch (err) {
      console.error('Gửi email thất bại:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản học sinh thành công',
      data: {
        studentId: newStudent._id,
        email: newStudent.email,
        password: randomPassword,
        student_full_name,
      },
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tài khoản học sinh',
      error: error.message,
    });
  }
};
// src/controllers/student.controller.js

exports.getMyStudents = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng',
      });
    }

    const tutorId = req.user._id;

    // Tìm role STUDENT (phải có bước này!)
    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      console.error('Không tìm thấy role STUDENT trong database');
      return res.status(500).json({
        success: false,
        message: 'Hệ thống chưa có role STUDENT. Vui lòng tạo role này trước.',
      });
    }

    // Bây giờ dùng studentRole._id
    const students = await User.find({
      roles: studentRole._id,  // ← dùng studentRole._id thay vì studentRoleId
      // Nếu bạn đã thêm field tutor_id trong student_profile thì thêm điều kiện này:
      // 'student_profile.tutor_id': tutorId,
      // Hiện tại tạm lấy tất cả học sinh để test (sau này lọc theo tutor)
    })
      .select('full_name email dob gender school phone student_profile.status')
      .lean();  // Tăng hiệu suất, không cần mongoose document

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Lỗi GET /api/students:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách học sinh',
      error: error.message,
    });
  }
};