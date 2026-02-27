// src/controllers/class.controller.js
const Class = require('../models/class.model');
const ClassEnrollment = require('../models/classEnrollment.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// 1. Tạo lớp học mới
exports.createClass = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const {
      name,
      level,
      default_mode,
      default_location,
      default_online_link,
      start_date,
      end_date,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên lớp là bắt buộc' });
    }

    const newClass = new Class({
      tutor_user_id: tutorId,
      name,
      level,
      default_mode: default_mode || 'OFFLINE',
      default_location,
      default_online_link,
      start_date,
      end_date,
    });

    await newClass.save();

    res.status(201).json({
      message: 'Tạo lớp học thành công',
      data: newClass,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo lớp', error: error.message });
  }
};

// 2. Lấy danh sách lớp của tutor
exports.getMyClasses = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const classes = await Class.find({ tutor_user_id: tutorId })
      .sort({ created_at: -1 })
      .select('-enrolled_students'); // Không populate để nhẹ response

    res.status(200).json({
      message: 'Lấy danh sách lớp học thành công',
      data: classes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Lấy chi tiết lớp (bao gồm danh sách học sinh)
exports.getClassDetail = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.id;

    const classDetail = await Class.findOne({ _id: classId, tutor_user_id: tutorId });

    if (!classDetail) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    // Lấy danh sách học sinh đang ACTIVE
    const enrollments = await ClassEnrollment.find({
      class_id: classId,
      status: 'ACTIVE',
    }).populate('student_user_id', 'full_name email phone');

    res.status(200).json({
      message: 'Lấy chi tiết lớp học thành công',
      data: {
        class: classDetail,
        enrolled_students: enrollments,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 4. Cập nhật thông tin lớp
exports.updateClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.id;

    const updates = req.body;

    const updatedClass = await Class.findOneAndUpdate(
      { _id: classId, tutor_user_id: tutorId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
    }

    res.status(200).json({
      message: 'Cập nhật lớp học thành công',
      data: updatedClass,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 5. Xóa lớp học
exports.deleteClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.id;

    const deletedClass = await Class.findOneAndDelete({ _id: classId, tutor_user_id: tutorId });

    if (!deletedClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
    }

    // Optional: Xóa toàn bộ enrollment liên quan
    await ClassEnrollment.deleteMany({ class_id: classId });

    res.status(200).json({
      message: 'Xóa lớp học thành công',
      data: deletedClass,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 6. Thêm học sinh vào lớp
exports.assignStudent = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.id;
    const { student_user_id } = req.body;

    if (!student_user_id) {
      return res.status(400).json({ message: 'Thiếu student_user_id' });
    }

    // Kiểm tra lớp tồn tại và thuộc tutor
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    // Kiểm tra học sinh tồn tại (không cần check role STUDENT để đơn giản)
    const student = await User.findById(student_user_id);
    if (!student) {
      return res.status(400).json({ message: 'Học sinh không tồn tại' });
    }

    // Kiểm tra đã enroll chưa
    const existingEnrollment = await ClassEnrollment.findOne({
      class_id: classId,
      student_user_id: student_user_id,  // dùng string trực tiếp
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        return res.status(400).json({ message: 'Học sinh đã được thêm vào lớp' });
      }
      // Active lại nếu trước đó LEFT
      existingEnrollment.status = 'ACTIVE';
      existingEnrollment.left_at = undefined;
      await existingEnrollment.save();
      return res.status(200).json({ message: 'Học sinh đã được thêm lại vào lớp', data: existingEnrollment });
    }

    // Tạo mới enrollment
    const enrollment = new ClassEnrollment({
      class_id: classId,
      student_user_id: student_user_id,
      status: 'ACTIVE',
    });

    await enrollment.save();

    res.status(201).json({
      message: 'Thêm học sinh vào lớp thành công',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 7. Xóa học sinh khỏi lớp
exports.removeStudent = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.id;
    const { student_user_id } = req.body;

    if (!student_user_id) {
      return res.status(400).json({ message: 'Thiếu student_user_id' });
    }

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
    }

    const enrollment = await ClassEnrollment.findOne({ class_id: classId, student_user_id });
    if (!enrollment || enrollment.status === 'LEFT') {
      return res.status(400).json({ message: 'Học sinh không tồn tại trong lớp hoặc đã rời' });
    }

    enrollment.status = 'LEFT';
    enrollment.left_at = new Date();
    await enrollment.save();

    res.status(200).json({
      message: 'Xóa học sinh khỏi lớp thành công',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};