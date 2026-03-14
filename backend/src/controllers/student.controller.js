// src/controllers/student.controller.js
const mongoose = require('mongoose');
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

    const hasTutorRole = tutor.roles.some(role =>
      (typeof role === 'string' && role === 'TUTOR') ||
      (role && role.name === 'TUTOR')
    );

    if (!hasTutorRole) {
      return res.status(403).json({ success: false, message: 'Chỉ gia sư mới có quyền tạo tài khoản học sinh' });
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

    if (!student_full_name || !email) {
      return res.status(400).json({ success: false, message: 'Thiếu họ tên hoặc email' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    }

    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      return res.status(500).json({ success: false, message: 'Hệ thống chưa có role STUDENT' });
    }

    // Tạo student profile – KHÔNG có password_hash
    const studentProfile = {
      student_full_name: student_full_name.trim(),
      school: school?.trim(),
      grade: grade?.trim(),
      class_name: class_name?.trim(),
      gender,
      dob: dob ? new Date(dob) : undefined,
      tutor: tutor._id,
      tutor_schedules: tutor_schedules.map(s => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject || '',
        isActive: true,
      })),
      has_completed_assignment: false,
      status: 'ACTIVE', // trạng thái profile riêng (có thể giữ ACTIVE)
    };

    const newStudent = new User({
      email: email.toLowerCase().trim(),
      // KHÔNG tạo password_hash ở đây
      full_name: student_full_name.trim(),
      phone: phone?.trim(),
      status: 'PENDING',           // ← Trạng thái chờ kích hoạt
      roles: [studentRole._id],
      student_profile: studentProfile,
      isEmailVerified: false,
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Đã tạo hồ sơ học sinh thành công (chờ kích hoạt)',
      data: {
        studentId: newStudent._id,
        email: newStudent.email,
        full_name: newStudent.full_name,
        status: newStudent.status,
      },
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
// src/controllers/student.controller.js

exports.activateStudentAccount = async (req, res) => {
  try {
    const tutor = req.user;
    const studentId = req.params.studentId;

    // Kiểm tra quyền tutor
    const hasTutorRole = tutor.roles.some(role =>
      (typeof role === 'string' && role === 'TUTOR') ||
      (role && role.name === 'TUTOR')
    );
    if (!hasTutorRole) {
      return res.status(403).json({ success: false, message: 'Chỉ gia sư mới có quyền kích hoạt' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    if (student.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Tài khoản không ở trạng thái chờ kích hoạt' });
    }

    if (student.password_hash) {
      return res.status(400).json({ success: false, message: 'Tài khoản đã có mật khẩu' });
    }

    // Tạo mật khẩu ngẫu nhiên
    const randomPassword = generateRandomPassword(12); // hàm này phải tồn tại
    const password_hash = await bcrypt.hash(randomPassword, 12);

    student.password_hash = password_hash;
    student.status = 'ACTIVE';
    student.isEmailVerified = false;

    await student.save();

    // Gửi email (nếu thất bại thì vẫn success, chỉ log lỗi)
    try {
      await sendStudentAccountEmail({
        to: student.email,
        studentName: student.full_name || student.student_profile?.student_full_name,
        tutorName: tutor.full_name,
        password: randomPassword,
        loginUrl: 'http://localhost:3000/login', // thay bằng url thật
      });
    } catch (emailErr) {
      console.error('Gửi email thất bại:', emailErr);
    }

    res.status(200).json({
      success: true,
      message: 'Đã kích hoạt tài khoản và gửi thông tin đăng nhập',
      data: { studentId: student._id, email: student.email, status: student.status }
    });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
exports.getStudents = async (req, res) => {
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
      roles: studentRole._id,
    })
      .select(
        'full_name email phone dob gender status ' +
        'student_profile.student_full_name ' +
        'student_profile.school ' +
        'student_profile.grade ' +
        'student_profile.class_name'
      )
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


// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    const student = await User.findById(studentId)
      .select('-password_hash -__v') // loại bỏ thông tin nhạy cảm
      .populate('roles', 'name')     // nếu cần
      .lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học sinh",
      });
    }


    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
exports.updateStudent = async (req, res) => {
  try {
    const tutor = req.user;
    const studentId = req.params.studentId;
    // Kiểm tra quyền tutor
    const hasTutorRole = tutor.roles.some(role =>
      (typeof role === 'string' && role === 'TUTOR') ||
      (role && role.name === 'TUTOR')
    );

    if (!hasTutorRole) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ gia sư mới có quyền chỉnh sửa thông tin học sinh',
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh',
      });
    }

    // Chỉ cho phép cập nhật các trường an toàn
    const allowedUpdates = [
      'full_name', 'email', 'phone', 'dob', 'gender',
      'student_profile.student_full_name',
      'student_profile.school',
      'student_profile.grade',
      'student_profile.class_name',
    ];

    const updates = req.body;

    // Xử lý cập nhật nested student_profile
    if (updates.student_profile) {
      Object.keys(updates.student_profile).forEach(key => {
        if (student.student_profile) {
          student.student_profile[key] = updates.student_profile[key];
        } else {
          student.student_profile = { [key]: updates.student_profile[key] };
        }
      });
      delete updates.student_profile;
    }

    // Cập nhật các trường root
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        student[key] = updates[key];
      }
    });

    // Nếu email thay đổi → kiểm tra trùng lặp
    if (updates.email && updates.email.toLowerCase() !== student.email) {
      const emailExists = await User.findOne({ email: updates.email.toLowerCase() });
      if (emailExists && emailExists._id.toString() !== studentId) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác',
        });
      }
      student.email = updates.email.toLowerCase();
    }

    await student.save();

    // Trả về dữ liệu đã cập nhật (không lộ password_hash)
    const updatedStudent = await User.findById(studentId)
      .select('-password_hash -__v')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin học sinh thành công',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin',
      error: error.message,
    });
  }
};
exports.getMyStudents = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      return res.status(500).json({
        success: false,
        message: 'Hệ thống chưa có role STUDENT',
      });
    }

    const students = await User.find({
      roles: studentRole._id,
      'student_profile.tutor': tutorId,  // lọc theo tutor chủ quản
      // 'student_profile.status': 'ACTIVE'   // có thể bật nếu muốn chỉ lấy hs active
    })
      .select(
        'full_name email phone dob gender status ' +
        'student_profile.student_full_name ' +
        'student_profile.school ' +
        'student_profile.grade ' +
        'student_profile.class_name ' +
        'student_profile.tutor_schedules'
      )
      .sort({ createdAt: -1 }) // mới nhất lên đầu (tùy chọn)
      .lean();

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Lỗi getMyStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách học sinh',
      error: error.message,
    });
  }
};